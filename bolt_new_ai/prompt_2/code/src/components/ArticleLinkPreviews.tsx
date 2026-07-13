import { useMemo } from 'react';
import { LinkPreviewCard } from './LinkPreviewCard';

/**
 * Extracts the first external link URL found in the given HTML content
 * and renders a preview card for it. Used in the article reader view.
 */
export function ArticleLinkPreviews({ html }: { html: string }) {
  const urls = useMemo(() => extractExternalLinks(html), [html]);

  if (urls.length === 0) return null;
  return (
    <div className="mt-6 space-y-2">
      {urls.slice(0, 3).map((u) => (
        <LinkPreviewCard key={u} url={u} />
      ))}
    </div>
  );
}

function extractExternalLinks(html: string): string[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a[href]'));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const a of links) {
    const href = (a as HTMLAnchorElement).getAttribute('href') || '';
    if (/^https?:\/\//i.test(href) && !seen.has(href)) {
      seen.add(href);
      result.push(href);
    }
  }
  return result;
}
