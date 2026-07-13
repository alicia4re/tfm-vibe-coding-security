import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { toast } from "sonner";
import { Save, Send, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const { user, isEditor, isAuthor } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [cover, setCover] = useState("");
  const [status, setStatus] = useState<"draft" | "in_review" | "published">("draft");
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const { data: article } = useQuery({
    queryKey: ["edit-article", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (article && loadedId !== article.id) {
      setTitle(article.title);
      setContent(article.content);
      setTagsText(article.tags.join(", "));
      setCover(article.cover_image_url ?? "");
      setStatus(article.status);
      setLoadedId(article.id);
    }
  }, [article, loadedId]);

  const canEdit = isNew ? isAuthor : article ? article.author_id === user?.id || isEditor : true;

  const save = useMutation({
    mutationFn: async (targetStatus?: "draft" | "in_review" | "published") => {
      if (!user) throw new Error("no user");
      const tags = tagsText.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const payload = {
        title: title.trim() || "(Sin título)",
        content,
        tags,
        cover_image_url: cover.trim() || null,
        status: targetStatus ?? status,
      };
      if (isNew) {
        const { data, error } = await supabase.from("articles").insert({ ...payload, author_id: user.id }).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("articles").update(payload).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success("Guardado");
      qc.invalidateQueries();
      if (isNew && data) navigate({ to: "/editor/$id", params: { id: data.id } });
      else if (data) setStatus(data.status);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al guardar"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artículo eliminado");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!canEdit) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">No tienes permiso para editar este artículo.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-serif font-semibold">
          {isNew ? "Nuevo artículo" : "Editar artículo"}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium ${
            status === "published" ? "bg-success/15 text-success" : status === "in_review" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}>{status === "published" ? "Publicado" : status === "in_review" ? "En revisión" : "Borrador"}</span>
          <button
            onClick={() => save.mutate(undefined)}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Guardar
          </button>
          {status !== "in_review" && status !== "published" && (
            <button
              onClick={() => save.mutate("in_review")}
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Enviar a revisión
            </button>
          )}
          {isEditor && status !== "published" && (
            <button
              onClick={() => save.mutate("published")}
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 bg-success text-success-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-success/90 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Publicar
            </button>
          )}
          {isEditor && status === "published" && (
            <button
              onClick={() => save.mutate("draft")}
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Despublicar
            </button>
          )}
          {!isNew && (
            <button
              onClick={() => {
                if (window.confirm("¿Eliminar este artículo?")) remove.mutate();
              }}
              className="inline-flex items-center gap-1.5 border border-destructive text-destructive rounded-md px-3 py-2 text-sm hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del artículo"
          className="w-full px-0 py-2 text-3xl font-serif font-semibold bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">URL imagen de portada (opcional)</label>
            <input
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Etiquetas (separadas por coma)</label>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="tecnología, diseño"
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </div>
        <MarkdownEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}
