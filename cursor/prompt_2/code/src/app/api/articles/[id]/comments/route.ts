import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article || article.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Solo se pueden comentar artículos publicados" },
      { status: 400 }
    );
  }

  const { content } = await request.json();
  if (!content || !content.trim()) {
    return NextResponse.json(
      { error: "El comentario no puede estar vacío" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      articleId: id,
      userId: user.id,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(
    { message: "Comentario añadido", comment },
    { status: 201 }
  );
}
