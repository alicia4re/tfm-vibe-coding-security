"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Input, Badge, StatusBadge } from "@/components/ui";
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
  _count: { comments: number };
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async (q?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/articles?${params}`);
    const data = await res.json();
    setArticles(data.articles || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(search);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Artículos publicados
        </h1>
        <p className="mt-2 text-gray-500">
          Descubre contenido de nuestros autores
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <Input
          placeholder="Buscar por título, contenido o etiqueta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          No se encontraron artículos publicados.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles
            .filter((a) => a.status === "PUBLISHED")
            .map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <StatusBadge status={article.status} />
                  {article.tags.slice(0, 2).map((t) => (
                    <Badge key={t.tag.name}>{t.tag.name}</Badge>
                  ))}
                </div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                  {article.title}
                </h2>
                <p className="mb-4 line-clamp-3 text-sm text-gray-500">
                  {article.content.replace(/<[^>]*>/g, "").slice(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{article.author.name}</span>
                  <span>
                    {formatDate(article.publishedAt || article.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
