import "server-only";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

const articleListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  createdAt: true,
  publishedAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true } },
  tags: { select: { id: true, name: true } },
} satisfies Prisma.ArticleSelect;

export async function getPublishedArticles(query?: string) {
  const where: Prisma.ArticleWhereInput = {
    status: "PUBLISHED",
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { tags: { some: { name: { contains: query.toLowerCase() } } } },
          ],
        }
      : {}),
  };

  return prisma.article.findMany({
    where,
    select: articleListSelect,
    orderBy: { publishedAt: "desc" },
  });
}

/** Articles visible to the current user in the /panel dashboard. */
export async function getDashboardArticles(user: CurrentUser) {
  const where: Prisma.ArticleWhereInput = user.role === "EDITOR" ? {} : { authorId: user.id };

  return prisma.article.findMany({
    where,
    select: articleListSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getArticleBySlugForViewer(slug: string, user: CurrentUser | null) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true } },
      tags: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  if (!article) return null;

  const canView =
    article.status === "PUBLISHED" ||
    (!!user && (user.role === "EDITOR" || user.id === article.authorId));

  if (!canView) return null;
  return article;
}

export async function getArticleForEdit(articleId: string, user: CurrentUser) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { tags: true, author: { select: { id: true, name: true } } },
  });
  if (!article) return null;

  const canEdit = user.role === "EDITOR" || (user.role === "AUTHOR" && article.authorId === user.id);
  if (!canEdit) return null;
  return article;
}
