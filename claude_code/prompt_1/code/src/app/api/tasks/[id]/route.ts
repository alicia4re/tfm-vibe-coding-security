import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";
import { deleteAttachmentFile } from "@/lib/storage";

async function loadOwnedTask(id: string, userId: string, isAdmin: boolean) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AuthError("Tarea no encontrada", 404);
  if (!isAdmin && task.ownerId !== userId) {
    throw new AuthError("No tienes permiso para acceder a esta tarea", 403);
  }
  return task;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const task = await loadOwnedTask(id, user.id, user.role === "ADMIN");
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await loadOwnedTask(id, user.id, user.role === "ADMIN");

    const body = await req.json();
    const data = taskSchema.partial().parse(body);

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.dueDate !== undefined
          ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
          : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const task = await loadOwnedTask(id, user.id, user.role === "ADMIN");

    if (task.attachmentPath) {
      await deleteAttachmentFile(task.attachmentPath);
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
