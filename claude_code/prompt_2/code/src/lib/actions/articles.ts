"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sanitizeArticleHtml, sanitizeCommentHtml, slugify } from "@/lib/sanitize";
import type { ActionState } from "@/lib/actions/auth";

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "articulo";
  let slug = base;
  let n = 1;
  // small dataset expected for a demo app — a loop is fine here.
  while (
    await prisma.article.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10)
    )
  );
}

const articleSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(160),
  content: z.string().trim().min(1, "El contenido no puede estar vacío"),
  excerpt: z.string().trim().max(300).optional().default(""),
  coverImage: z.union([z.string().trim().url("La URL de la imagen no es válida"), z.literal("")]).optional(),
  tags: z.string().trim().max(200).optional().default(""),
});

export async function createArticleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "AUTHOR" && user.role !== "EDITOR") {
    return { error: "No tienes permiso para crear artículos" };
  }

  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: formData.get("excerpt") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    tags: formData.get("tags") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { title, content, excerpt, coverImage, tags } = parsed.data;

  const slug = await uniqueSlug(title);
  const tagNames = parseTags(tags ?? "");

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      content: sanitizeArticleHtml(content),
      excerpt: excerpt || "",
      coverImage: coverImage || null,
      status: "DRAFT",
      authorId: user.id,
      tags: {
        connectOrCreate: tagNames.map((name) => ({ where: { name }, create: { name } })),
      },
    },
  });

  revalidatePath("/panel");
  redirect(`/panel/articulos/${article.id}`);
}

export async function updateArticleAction(
  articleId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return { error: "Artículo no encontrado" };

  const isOwner = article.authorId === user.id;
  const canEdit = user.role === "EDITOR" || (user.role === "AUTHOR" && isOwner);
  if (!canEdit) return { error: "No tienes permiso para editar este artículo" };

  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: formData.get("excerpt") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    tags: formData.get("tags") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { title, content, excerpt, coverImage, tags } = parsed.data;

  const slug = title === article.title ? article.slug : await uniqueSlug(title, article.id);
  const tagNames = parseTags(tags ?? "");

  await prisma.article.update({
    where: { id: articleId },
    data: {
      title,
      slug,
      content: sanitizeArticleHtml(content),
      excerpt: excerpt || "",
      coverImage: coverImage || null,
      tags: {
        set: [],
        connectOrCreate: tagNames.map((name) => ({ where: { name }, create: { name } })),
      },
    },
  });

  revalidatePath("/panel");
  revalidatePath(`/articulos/${slug}`);
  return { success: "Artículo guardado correctamente" };
}

export async function deleteArticleAction(articleId: string): Promise<void> {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return;

  const isOwner = article.authorId === user.id;
  const canDelete = user.role === "EDITOR" || (user.role === "AUTHOR" && isOwner);
  if (!canDelete) return;

  await prisma.article.delete({ where: { id: articleId } });
  revalidatePath("/panel");
  redirect("/panel");
}

export async function submitForReviewAction(articleId: string): Promise<void> {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.authorId !== user.id) return;
  if (article.status !== "DRAFT") return;

  await prisma.article.update({ where: { id: articleId }, data: { status: "IN_REVIEW" } });
  revalidatePath("/panel");
}

export async function withdrawFromReviewAction(articleId: string): Promise<void> {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.authorId !== user.id) return;
  if (article.status !== "IN_REVIEW") return;

  await prisma.article.update({ where: { id: articleId }, data: { status: "DRAFT" } });
  revalidatePath("/panel");
}

export async function publishArticleAction(articleId: string): Promise<void> {
  const user = await requireUser();
  if (user.role !== "EDITOR") return;

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return;

  await prisma.article.update({
    where: { id: articleId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/articulos/${article.slug}`);
}

export async function unpublishArticleAction(articleId: string): Promise<void> {
  const user = await requireUser();
  if (user.role !== "EDITOR") return;

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return;

  await prisma.article.update({ where: { id: articleId }, data: { status: "DRAFT" } });
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/articulos/${article.slug}`);
}

const commentSchema = z.object({
  content: z.string().trim().min(1, "El comentario no puede estar vacío").max(3000),
});

export async function addCommentAction(
  articleId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.status !== "PUBLISHED") {
    return { error: "Este artículo no admite comentarios" };
  }

  const parsed = commentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Comentario inválido" };
  }

  const clean = sanitizeCommentHtml(parsed.data.content);
  if (!clean.replace(/<[^>]*>/g, "").trim()) {
    return { error: "El comentario no puede estar vacío" };
  }

  await prisma.comment.create({
    data: { content: clean, articleId, authorId: user.id },
  });

  revalidatePath(`/articulos/${article.slug}`);
  return { success: "Comentario publicado" };
}
