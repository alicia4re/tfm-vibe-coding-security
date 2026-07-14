import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return request.nextUrl.searchParams.get("token");
}

export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Falta el token de API. Envíalo como 'Authorization: Bearer <token>' o '?token='." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({ where: { apiToken: token } });
  if (!user) {
    return NextResponse.json({ error: "Token de API inválido" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20));

  const where = {
    status: "PUBLISHED" as const,
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { tags: { some: { name: { contains: q.toLowerCase() } } } },
          ],
        }
      : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { name: true } },
        tags: { select: { name: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      coverImage: a.coverImage,
      author: a.author.name,
      tags: a.tags.map((t) => t.name),
      publishedAt: a.publishedAt,
    })),
  });
}
