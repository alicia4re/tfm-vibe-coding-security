import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
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

  const { action } = await request.json();

  switch (action) {
    case "submit_review": {
      if (article.authorId !== user.id && user.role !== "EDITOR") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (article.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Solo los borradores pueden enviarse a revisión" },
          { status: 400 }
        );
      }
      const updated = await prisma.article.update({
        where: { id },
        data: { status: "IN_REVIEW" },
      });
      return NextResponse.json({
        message: "Artículo enviado a revisión",
        article: updated,
      });
    }

    case "publish": {
      if (user.role !== "EDITOR") {
        return NextResponse.json(
          { error: "Solo los editores pueden publicar" },
          { status: 403 }
        );
      }
      const updated = await prisma.article.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      return NextResponse.json({
        message: "Artículo publicado",
        article: updated,
      });
    }

    case "unpublish": {
      if (user.role !== "EDITOR") {
        return NextResponse.json(
          { error: "Solo los editores pueden despublicar" },
          { status: 403 }
        );
      }
      const updated = await prisma.article.update({
        where: { id },
        data: { status: "DRAFT", publishedAt: null },
      });
      return NextResponse.json({
        message: "Artículo despublicado",
        article: updated,
      });
    }

    case "reject": {
      if (user.role !== "EDITOR") {
        return NextResponse.json(
          { error: "Solo los editores pueden rechazar" },
          { status: 403 }
        );
      }
      const updated = await prisma.article.update({
        where: { id },
        data: { status: "DRAFT" },
      });
      return NextResponse.json({
        message: "Artículo devuelto a borrador",
        article: updated,
      });
    }

    default:
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }
}
