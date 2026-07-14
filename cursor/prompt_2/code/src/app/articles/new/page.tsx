"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Input, Button, Alert } from "@/components/ui";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function NewArticlePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.role === "READER") router.push("/dashboard");
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/articles/${data.article.id}/edit`);
    } catch {
      setError("Error al crear el artículo");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          &larr; Volver al panel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Nuevo artículo</h1>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Etiquetas (separadas por coma)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tecnología, javascript, tutorial"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contenido
          </label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Guardar borrador
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
