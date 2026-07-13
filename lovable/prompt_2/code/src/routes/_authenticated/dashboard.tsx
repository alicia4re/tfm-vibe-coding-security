import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PenSquare, KeyRound, Copy, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  in_review: "En revisión",
  published: "Publicado",
};

function Dashboard() {
  const { user, displayName, roles, isAuthor } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState(displayName);

  const { data: articles = [] } = useQuery({
    queryKey: ["my-articles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, status, updated_at, tags")
        .eq("author_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveName = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nombre actualizado");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const rotateToken = useMutation({
    mutationFn: async () => {
      // Generate hex 48 chars in browser (crypto)
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const { error } = await supabase.from("profiles").update({ api_token: token }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Token regenerado");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const apiUrl = profile ? `${window.location.origin}/api/public/articles?token=${profile.api_token}` : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold">Tu panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Roles: {roles.map((r) => <span key={r} className="ml-1 inline-block bg-accent px-2 py-0.5 rounded text-xs">{r}</span>)}
          </p>
        </div>
        {isAuthor && (
          <Link
            to="/editor/$id"
            params={{ id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <PenSquare className="w-4 h-4" /> Nuevo artículo
          </Link>
        )}
      </div>

      {!isAuthor && (
        <div className="mb-8 p-4 rounded-lg border border-border bg-muted/40 text-sm">
          Tienes rol de <strong>lector</strong>. Puedes leer y comentar. Pide a un editor que te asigne el rol <strong>autor</strong> para poder escribir.
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-serif font-semibold mb-4">Tus artículos</h2>
        {articles.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Aún no has escrito ningún artículo.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {articles.map((a, i) => (
              <Link
                key={a.id}
                to="/editor/$id"
                params={{ id: a.id }}
                className={`flex items-center justify-between gap-3 p-4 hover:bg-accent transition-colors ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.title || "(Sin título)"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Actualizado {new Date(a.updated_at).toLocaleDateString("es-ES")}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  a.status === "published" ? "bg-success/15 text-success" : a.status === "in_review" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {statusLabel[a.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-serif font-semibold mb-4">Perfil</h2>
        <div className="border border-border rounded-lg p-5 max-w-md">
          <label className="block text-sm font-medium mb-1.5">Nombre visible</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => saveName.mutate()}
              disabled={saveName.isPending || !name.trim()}
              className="rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-serif font-semibold mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> API pública
        </h2>
        <div className="border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground mb-3">
            Usa este token personal para consultar los artículos publicados en JSON.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="flex-1 min-w-[200px] px-3 py-2 rounded-md bg-muted text-xs font-mono break-all">
              {apiUrl || "Cargando…"}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiUrl);
                toast.success("Copiado");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
            <button
              onClick={() => rotateToken.mutate()}
              disabled={rotateToken.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerar
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            También aceptado como cabecera: <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;token&gt;</code>
          </p>
        </div>
      </section>
    </div>
  );
}
