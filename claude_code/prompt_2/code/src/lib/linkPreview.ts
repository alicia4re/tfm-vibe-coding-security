import "server-only";
import * as cheerio from "cheerio";

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

function isSafeHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

/** Fetches basic Open Graph / meta metadata from an external URL for link previews. */
export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview | null> {
  const url = isSafeHttpUrl(rawUrl);
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BlogAppLinkPreview/1.0)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const meta = (name: string) =>
      $(`meta[property="${name}"]`).attr("content") ??
      $(`meta[name="${name}"]`).attr("content") ??
      null;

    const title = meta("og:title") ?? $("title").first().text() ?? null;
    const description = meta("og:description") ?? meta("description") ?? null;
    let image = meta("og:image") ?? null;
    if (image) {
      try {
        image = new URL(image, url.toString()).toString();
      } catch {
        image = null;
      }
    }
    const siteName = meta("og:site_name") ?? url.hostname;

    return {
      url: url.toString(),
      title: title?.trim().slice(0, 200) || null,
      description: description?.trim().slice(0, 300) || null,
      image,
      siteName,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
