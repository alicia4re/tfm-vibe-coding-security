import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes (JPEG, PNG, GIF, WebP) o PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo no puede superar 5 MB" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    if (task.attachment) {
      try {
        await unlink(path.join(process.cwd(), "public", task.attachment.filepath));
      } catch {
        // ignore
      }
      await prisma.attachment.delete({ where: { id: task.attachment.id } });
    }

    const ext = file.name.split(".").pop() || "bin";
    const filename = `${randomUUID()}.${ext}`;
    const filepath = `uploads/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(process.cwd(), "public", filepath), buffer);

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        filepath,
        mimetype: file.type,
        size: file.size,
        taskId: id,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al subir archivo" },
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

    if (!task || !task.attachment) {
      return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && task.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
      await unlink(path.join(process.cwd(), "public", task.attachment.filepath));
    } catch {
      // ignore
    }

    await prisma.attachment.delete({ where: { id: task.attachment.id } });

    return NextResponse.json({ message: "Adjunto eliminado" });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar adjunto" },
      { status: 500 }
    );
  }
}
