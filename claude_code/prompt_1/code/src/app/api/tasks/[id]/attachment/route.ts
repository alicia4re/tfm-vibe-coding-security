import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import {
  saveAttachment,
  deleteAttachmentFile,
  attachmentAbsolutePath,
} from "@/lib/storage";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } from "@/lib/validation";

async function loadOwnedTask(id: string, userId: string, isAdmin: boolean) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AuthError("Tarea no encontrada", 404);
  if (!isAdmin && task.ownerId !== userId) {
    throw new AuthError("No tienes permiso para acceder a esta tarea", 403);
  }
  return task;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const task = await loadOwnedTask(id, user.id, user.role === "ADMIN");

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 });
    }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes o archivos PDF" },
        { status: 400 }
      );
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { error: "El archivo supera el tamaño máximo de 5 MB" },
        { status: 400 }
      );
    }

    if (task.attachmentPath) {
      await deleteAttachmentFile(task.attachmentPath);
    }

    const { storedName } = await saveAttachment(id, file);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        attachmentName: file.name,
        attachmentPath: storedName,
        attachmentType: file.type,
        attachmentSize: file.size,
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const task = await loadOwnedTask(id, user.id, user.role === "ADMIN");

    if (!task.attachmentPath || !task.attachmentName || !task.attachmentType) {
      return NextResponse.json({ error: "Esta tarea no tiene archivo adjunto" }, { status: 404 });
    }

    const buffer = await readFile(attachmentAbsolutePath(task.attachmentPath));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": task.attachmentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(task.attachmentName)}"`,
        "Content-Length": String(task.attachmentSize ?? buffer.length),
      },
    });
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

    const updated = await prisma.task.update({
      where: { id },
      data: {
        attachmentName: null,
        attachmentPath: null,
        attachmentType: null,
        attachmentSize: null,
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
