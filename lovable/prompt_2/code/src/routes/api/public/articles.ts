import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/articles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const auth = request.headers.get("authorization");
        const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        const token = bearer ?? url.searchParams.get("token");
        if (!token) {
          return Response.json({ error: "Missing API token" }, { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name")
          .eq("api_token", token)
          .maybeSingle();
        if (!profile) {
          return Response.json({ error: "Invalid API token" }, { status: 401 });
        }
        const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
        const { data: articles, error } = await supabaseAdmin
          .from("articles")
          .select("id, title, content, tags, cover_image_url, published_at, author_id")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(limit);
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
        const ids = Array.from(new Set((articles ?? []).map((a) => a.author_id)));
        const { data: profs } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);
        const names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
        return Response.json(
          {
            count: articles?.length ?? 0,
            authenticated_as: profile.display_name,
            articles: (articles ?? []).map((a) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              tags: a.tags,
              cover_image_url: a.cover_image_url,
              published_at: a.published_at,
              author: { id: a.author_id, display_name: names[a.author_id] ?? null },
            })),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
