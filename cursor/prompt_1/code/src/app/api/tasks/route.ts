import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import { Status, Priority } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Status | null;
    const priority = searchParams.get("priority") as Priority | null;
    const search = searchParams.get("search") || "";
    const userId = searchParams.get("userId");

    const where: Prisma.TaskWhereInput = {};

    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        attachment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, dueDate, priority, status } = parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        attachment: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear tarea" },
      { status: 500 }
    );
  }
}
