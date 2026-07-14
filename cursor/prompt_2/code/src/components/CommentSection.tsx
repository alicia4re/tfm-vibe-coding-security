"use client";

import { useState } from "react";
import { Button } from "./ui";
import { RichTextDisplay } from "./RichTextEditor";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface CommentSectionProps {
  articleId: string;
  initialComments: Comment[];
  isAuthenticated: boolean;
}

export function CommentSection({
  articleId,
  initialComments,
  isAuthenticated,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setComments([data.comment, ...comments]);
      setContent("");
    } catch {
      setError("Error al enviar el comentario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Comentarios ({comments.length})
      </h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe un comentario... (admite **negrita**, *cursiva*)"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" loading={loading}>
            Comentar
          </Button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          <a href="/auth/login" className="text-indigo-600 hover:underline">
            Inicia sesión
          </a>{" "}
          para comentar.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border border-gray-100 bg-gray-50 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {comment.user.name}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <RichTextDisplay content={formatCommentContent(comment.content)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCommentContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}
