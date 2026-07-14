import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canViewArticle } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSession();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const mine = searchParams.get("mine") === "true";

  const where: Record<string, unknown> = {};

  if (mine && user) {
    where.authorId = user.id;
  } else if (user?.role === "EDITOR") {
    if (status) where.status = status;
    else where.status = { in: ["DRAFT", "IN_REVIEW", "PUBLISHED"] };
  } else if (user) {
    where.OR = [
      { status: "PUBLISHED" },
      { authorId: user.id },
    ];
  } else {
    where.status = "PUBLISHED";
  }

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { tags: { some: { tag: { name: { contains: q } } } } },
        ],
      },
    ];
  }

  const articles = await prisma.article.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = articles.filter((a) => canViewArticle(user, a));

  return NextResponse.json({ articles: filtered });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (user.role === "READER") {
    return NextResponse.json(
      { error: "Los lectores no pueden crear artículos" },
      { status: 403 }
    );
  }

  const { title, content, tags } = await request.json();

  if (!title || !content) {
    return NextResponse.json(
      { error: "Título y contenido son obligatorios" },
      { status: 400 }
    );
  }

  const tagNames: string[] = tags
    ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const article = await prisma.article.create({
    data: {
      title,
      content,
      authorId: user.id,
      status: "DRAFT",
      tags: {
        create: await Promise.all(
          tagNames.map(async (name) => {
            const tag = await prisma.tag.upsert({
              where: { name },
              create: { name },
              update: {},
            });
            return { tagId: tag.id };
          })
        ),
      },
    },
    include: {
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ message: "Artículo creado", article }, { status: 201 });
}
