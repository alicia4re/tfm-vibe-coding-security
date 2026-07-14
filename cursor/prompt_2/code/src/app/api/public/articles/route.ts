import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromApiToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token de API requerido. Usa: Authorization: Bearer <token>" },
      { status: 401 }
    );
  }

  const apiToken = authHeader.slice(7);
  const user = await getUserFromApiToken(apiToken);
  if (!user) {
    return NextResponse.json(
      { error: "Token de API no válido" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const where: Record<string, unknown> = { status: "PUBLISHED" };

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
      { tags: { some: { tag: { name: { contains: q } } } } },
    ];
  }

  const articles = await prisma.article.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const result = articles.map((a) => ({
    ...a,
    tags: a.tags.map((t) => t.tag.name),
  }));

  return NextResponse.json({ articles: result, count: result.length });
}
