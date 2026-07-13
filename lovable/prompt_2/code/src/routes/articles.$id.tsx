import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { renderMarkdown } from "@/lib/markdown";
import { toast } from "sonner";
import { Calendar, User, Send } from "lucide-react";

export const Route = createFileRoute("/articles/$id")({
  component: ArticlePage,
});

function ArticlePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("not-found");
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", data.author_id).maybeSingle();
      return { ...data, author_name: p?.display_name ?? "Autor" };
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, author_id")
        .eq("article_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((c) => c.author_id)));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: p } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        names = Object.fromEntries((p ?? []).map((x) => [x.id, x.display_name]));
      }
      return (data ?? []).map((c) => ({ ...c, author_name: names[c.author_id] ?? "Anónimo" }));
    },
    enabled: !!article && article.status === "published",
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Necesitas iniciar sesión");
      const { error } = await supabase.from("comments").insert({
        article_id: id,
        author_id: user.id,
        content: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Comentario publicado");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-16 text-muted-foreground">Cargando…</div>;
  if (error || !article)
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-serif">Artículo no disponible</h1>
        <p className="text-muted-foreground mt-2">Puede que no exista o que aún no esté publicado.</p>
        <Link to="/" className="inline-block mt-6 text-primary hover:underline">← Volver al inicio</Link>
      </div>
    );

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
          article.status === "published" ? "bg-success/15 text-success" : article.status === "in_review" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {article.status === "published" ? "Publicado" : article.status === "in_review" ? "En revisión" : "Borrador"}
        </span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-serif font-semibold tracking-tight mb-4">{article.title}</h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {article.author_name}</span>
        {article.published_at && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(article.published_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
      </div>
      {article.cover_image_url && (
        <img src={article.cover_image_url} alt={article.title} className="w-full rounded-lg mb-8 aspect-video object-cover" />
      )}
      <div className="prose-article" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />

      {article.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-2">
          {article.tags.map((t: string) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">#{t}</span>
          ))}
        </div>
      )}

      {article.status === "published" && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-serif font-semibold mb-6">Comentarios ({comments.length})</h2>
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) addComment.mutate();
              }}
              className="mb-8"
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Escribe tu comentario… (soporta **negrita**, *cursiva*, [enlaces](url))"
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-sans text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button
                  disabled={!comment.trim() || addComment.isPending}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Publicar
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 rounded-md border border-border bg-muted/50 text-sm text-muted-foreground text-center">
              <Link to="/auth" className="text-primary hover:underline">Inicia sesión</Link> para comentar.
            </div>
          )}
          <div className="space-y-6">
            {comments.map((c) => (
              <div key={c.id} className="border-l-2 border-border pl-4">
                <div className="text-xs text-muted-foreground mb-1">
                  <strong className="text-foreground">{c.author_name}</strong> ·{" "}
                  {new Date(c.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="prose-comment" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.content) }} />
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>}
          </div>
        </section>
      )}
    </article>
  );
}
