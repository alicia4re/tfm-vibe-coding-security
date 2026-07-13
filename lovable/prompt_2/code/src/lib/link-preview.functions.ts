import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({ url: z.string().url().max(2000) });

export const fetchLinkPreview = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PrismaBot/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const pick = (re: RegExp) => re.exec(html)?.[1]?.trim();
      const title =
        pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<title[^>]*>([^<]+)<\/title>/i) ??
        data.url;
      const image =
        pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
        null;
      const description =
        pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
        null;
      return { ok: true as const, title, image, description, url: data.url };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Error" };
    }
  });
