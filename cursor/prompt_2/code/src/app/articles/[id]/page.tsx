"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { StatusBadge, Badge } from "@/components/ui";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { CommentSection } from "@/components/CommentSection";
import { formatDate } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  author: { id: string; name: string };
  tags: { tag: { name: string } }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
  }[];
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setArticle(data.article);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          {error || "Artículo no encontrado"}
        </h1>
        <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const canEdit =
    user &&
    (user.role === "EDITOR" || user.id === article.author.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <StatusBadge status={article.status} />
        {article.tags.map((t) => (
          <Badge key={t.tag.name}>{t.tag.name}</Badge>
        ))}
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {article.title}
      </h1>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <span>Por {article.author.name}</span>
        <span>{formatDate(article.publishedAt || article.createdAt)}</span>
        {canEdit && (
          <Link
            href={`/articles/${article.id}/edit`}
            className="text-indigo-600 hover:underline"
          >
            Editar
          </Link>
        )}
      </div>

      <div className="mt-8">
        <RichTextDisplay content={article.content} />
      </div>

      {article.status === "PUBLISHED" && (
        <CommentSection
          articleId={article.id}
          initialComments={article.comments}
          isAuthenticated={!!user}
        />
      )}
    </article>
  );
}
