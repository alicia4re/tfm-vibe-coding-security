import * as cheerio from "cheerio";

export interface LinkPreview {
  title: string | null;
  image: string | null;
  description: string | null;
  url: string;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BlogBot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { title: null, image: null, description: null, url };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (property: string) =>
      $(`meta[property="${property}"]`).attr("content") ||
      $(`meta[name="${property}"]`).attr("content") ||
      null;

    const title =
      getMeta("og:title") ||
      $("title").text() ||
      null;

    const image = getMeta("og:image") || null;
    const description =
      getMeta("og:description") ||
      getMeta("description") ||
      null;

    return { title, image, description, url };
  } catch {
    return { title: null, image: null, description: null, url };
  }
}
