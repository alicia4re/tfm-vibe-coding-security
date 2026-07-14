import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSession,
  canViewArticle,
  canEditArticle,
} from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!article) {
    return NextResponse.json(
      { error: "Artículo no encontrado" },
      { status: 404 }
    );
  }

  if (!canViewArticle(user, article)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json({ article });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json(
      { error: "Artículo no encontrado" },
      { status: 404 }
    );
  }

  if (!canEditArticle(user, article.authorId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { title, content, tags } = await request.json();

  if (tags !== undefined) {
    await prisma.articleTag.deleteMany({ where: { articleId: id } });
    const tagNames: string[] = tags
      .split(",")
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean);

    for (const name of tagNames) {
      const tag = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await prisma.articleTag.create({
        data: { articleId: id, tagId: tag.id },
      });
    }
  }

  const updated = await prisma.article.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content && { content }),
    },
    include: {
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ message: "Artículo actualizado", article: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json(
      { error: "Artículo no encontrado" },
      { status: 404 }
    );
  }

  if (!canEditArticle(user, article.authorId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ message: "Artículo eliminado" });
}
