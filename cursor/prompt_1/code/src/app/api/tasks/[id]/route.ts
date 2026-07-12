import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations";
import { unlink } from "fs/promises";
import path from "path";

type RouteContext = { params: Promise<{ id: string }> };

async function canAccessTask(taskId: string, userId: string, role: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;
  if (role === "ADMIN" || task.userId === userId) return task;
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const task = await canAccessTask(id, session.user.id, session.user.role);

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    const fullTask = await prisma.task.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        attachment: true,
      },
    });

    return NextResponse.json(fullTask);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener tarea" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const task = await canAccessTask(id, session.user.id, session.user.role);

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
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

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        attachment: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar tarea" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { attachment: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && task.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (task.attachment) {
      try {
        await unlink(path.join(process.cwd(), "public", task.attachment.filepath));
      } catch {
        // file may not exist
      }
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: "Tarea eliminada" });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar tarea" },
      { status: 500 }
    );
  }
}
