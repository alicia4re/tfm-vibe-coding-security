import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/review")({
  component: ReviewPage,
});

function ReviewPage() {
  const { isEditor, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: articles = [] } = useQuery({
    queryKey: ["review-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, status, updated_at, author_id")
        .in("status", ["in_review", "draft", "published"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((a) => a.author_id)));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: p } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        names = Object.fromEntries((p ?? []).map((x) => [x.id, x.display_name]));
      }
      return (data ?? []).map((a) => ({ ...a, author_name: names[a.author_id] ?? "Autor" }));
    },
    enabled: isEditor,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "published" | "draft" }) => {
      const { error } = await supabase.from("articles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Actualizado");
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (loading) return <div className="p-8 text-muted-foreground">Cargando…</div>;
  if (!isEditor)
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-serif">Sólo para editores</h1>
        <p className="text-muted-foreground mt-2">Necesitas el rol editor para acceder aquí.</p>
      </div>
    );

  const inReview = articles.filter((a) => a.status === "in_review");
  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status === "draft");

  const Section = ({ title, items, primary }: { title: string; items: typeof articles; primary?: boolean }) => (
    <section className="mb-10">
      <h2 className="text-xl font-serif font-semibold mb-4">{title} ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aquí.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {items.map((a, i) => (
            <div key={a.id} className={`flex items-center justify-between gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{a.title || "(Sin título)"}</div>
                <div className="text-xs text-muted-foreground">Por {a.author_name} · {new Date(a.updated_at).toLocaleDateString("es-ES")}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to="/editor/$id"
                  params={{ id: a.id }}
                  className="inline-flex items-center gap-1 border border-border rounded-md px-2.5 py-1.5 text-xs hover:bg-accent"
                >
                  <Eye className="w-3.5 h-3.5" /> Abrir
                </Link>
                {a.status !== "published" ? (
                  <button
                    onClick={() => setStatus.mutate({ id: a.id, status: "published" })}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                      primary ? "bg-success text-success-foreground hover:bg-success/90" : "border border-border hover:bg-accent"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publicar
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus.mutate({ id: a.id, status: "draft" })}
                    className="inline-flex items-center gap-1 border border-border rounded-md px-2.5 py-1.5 text-xs hover:bg-accent"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Despublicar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-serif font-semibold mb-8">Cola editorial</h1>
      <Section title="En revisión" items={inReview} primary />
      <Section title="Publicados" items={published} />
      <Section title="Borradores" items={drafts} />
    </div>
  );
}
