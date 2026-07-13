import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const q = searchParams.get("q")?.trim();
    const scope = searchParams.get("scope"); // "all" (admin only) or omitted (own tasks)

    const where: Prisma.TaskWhereInput = {};

    if (user.role === "ADMIN" && scope === "all") {
      // no owner filter — admins can see everyone's tasks
    } else {
      where.ownerId = user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = taskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: data.status,
        ownerId: user.id,
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
