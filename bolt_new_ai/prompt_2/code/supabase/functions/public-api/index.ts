import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate via the user's personal API token (Authorization: Bearer <token>).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing API token. Provide it in the Authorization header as 'Bearer <token>'." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Validate the token and load the owning profile.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("api_token", token)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Invalid API token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read-only access to published articles. Supports ?q= (title/content/tag search) and ?tag=.
    const q = (url.searchParams.get("q") || "").trim();
    const tag = (url.searchParams.get("tag") || "").trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);

    let query = admin
      .from("articles")
      .select(`
        id, title, excerpt, content, tags, cover_image_url, published_at, created_at, updated_at,
        author:profiles!articles_author_id_fkey ( id, display_name, email )
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      return new Response(JSON.stringify({ error: articlesError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let results = articles || [];
    if (q) {
      const needle = q.toLowerCase();
      results = results.filter((a: any) =>
        (a.title || "").toLowerCase().includes(needle) ||
        (a.content || "").toLowerCase().includes(needle) ||
        (a.tags || []).some((t: string) => t.toLowerCase().includes(needle))
      );
    }

    return new Response(JSON.stringify({
      user: { email: profile.email, role: profile.role },
      count: results.length,
      articles: results,
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
