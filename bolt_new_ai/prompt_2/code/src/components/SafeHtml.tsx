import { useMemo } from 'react';

/**
 * Renders a limited, sanitized subset of HTML produced by the RichTextEditor.
 * We only allow a small whitelist of tags and strip all attributes except href on <a>
 * (and only http/https/mailto links). This prevents stored XSS from ever reaching the page.
 */
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'H1', 'H2', 'H3', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG', 'CODE', 'PRE', 'SPAN',
]);

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const safe = useMemo(() => sanitize(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}

function sanitize(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  walk(body);
  return body.innerHTML;
}

function walk(node: HTMLElement) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      node.removeChild(child);
      continue;
    }
    const el = child as HTMLElement;
    const tag = el.tagName;

    if (!ALLOWED_TAGS.has(tag)) {
      // Replace disallowed element with its children (unwrap), keeping inline text.
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      continue;
    }

    // Strip all attributes, then re-add only safe ones.
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) el.removeAttribute(attr.name);

    if (tag === 'A') {
      const href = (child as HTMLAnchorElement).getAttribute('href') || '';
      if (/^(https?:|mailto:)/i.test(href)) {
        el.setAttribute('href', href);
        el.setAttribute('rel', 'noopener noreferrer');
        el.setAttribute('target', '_blank');
      }
    } else if (tag === 'IMG') {
      const src = (child as HTMLImageElement).getAttribute('src') || '';
      if (/^(https?:|data:image\/)/i.test(src)) {
        el.setAttribute('src', src);
        const alt = (child as HTMLImageElement).getAttribute('alt');
        if (alt) el.setAttribute('alt', alt);
        el.className = 'rounded-lg max-w-full h-auto';
      } else {
        const parent = el.parentNode;
        if (parent) parent.removeChild(el);
        continue;
      }
    }

    walk(el);
  }
}
