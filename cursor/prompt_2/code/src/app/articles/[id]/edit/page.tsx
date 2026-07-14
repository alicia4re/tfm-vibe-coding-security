"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Input, Button, Alert, StatusBadge } from "@/components/ui";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.article) {
          setTitle(data.article.title);
          setContent(data.article.content);
          setTags(data.article.tags.map((t: { tag: { name: string } }) => t.tag.name).join(", "));
          setStatus(data.article.status);
        }
        setFetching(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage("Artículo guardado correctamente");
    } catch {
      setError("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar este artículo?")) return;

    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  };

  if (authLoading || fetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
            &larr; Volver al panel
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Editar artículo</h1>
            <StatusBadge status={status} />
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Eliminar
        </Button>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
      {message && <div className="mb-4"><Alert type="success" message={message} onClose={() => setMessage("")} /></div>}

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
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contenido
          </label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
        <Button type="submit" loading={loading}>
          Guardar cambios
        </Button>
      </form>
    </div>
  );
}
