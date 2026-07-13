import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Tag as TagIcon, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Prisma — Últimos artículos" },
      { name: "description", content: "Explora los artículos más recientes publicados por nuestra comunidad de autores." },
    ],
  }),
});

type Article = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  cover_image_url: string | null;
  published_at: string | null;
  author_id: string;
  author_name?: string;
};

function HomePage() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["published-articles", q, tag],
    queryFn: async (): Promise<Article[]> => {
      let query = supabase
        .from("articles")
        .select("id, title, content, tags, cover_image_url, published_at, author_id")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);
      if (q.trim()) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
      if (tag) query = query.contains("tags", [tag]);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
      }
      return rows.map((r) => ({ ...r, author_name: names[r.author_id] ?? "Autor" }));
    },
  });

  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).slice(0, 20);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="mb-10 max-w-3xl">
        <h1 className="text-5xl font-serif font-semibold tracking-tight">
          Ideas que se leen, se editan y se publican en equipo.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Un blog multi-autor con flujo editorial: escribe borradores, envíalos a revisión y publica cuando estén listos.
        </p>
      </section>

      <div className="mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, contenido o etiqueta"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {tag && (
          <button
            onClick={() => setTag(null)}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm"
          >
            <TagIcon className="w-3.5 h-3.5" /> {tag} ×
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t === tag ? null : t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                t === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : articles.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
          Aún no hay artículos publicados{q || tag ? " que coincidan con tu búsqueda" : ""}.
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              to="/articles/$id"
              params={{ id: a.id }}
              className="group block rounded-lg overflow-hidden border border-border hover:border-primary transition-colors bg-card"
            >
              {a.cover_image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={a.cover_image_url}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  {a.published_at ? new Date(a.published_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  <span>·</span>
                  <span>{a.author_name}</span>
                </div>
                <h2 className="font-serif text-xl font-semibold leading-snug group-hover:text-primary transition-colors">
                  {a.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {a.content.replace(/[#*`>_[\]()!]/g, "").slice(0, 180)}
                </p>
                {a.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
