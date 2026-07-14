import sanitizeHtml from "sanitize-html";

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "p", "br", "strong", "em", "u", "s", "blockquote",
      "ul", "ol", "li", "a", "img", "code", "pre", "hr", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "title", "class"],
      span: ["class"],
      code: ["class"],
      div: ["class", "data-url", "data-title", "data-image", "data-site"],
    },
    allowedClasses: {
      div: ["link-preview-card", "link-preview-body", "link-preview-title", "link-preview-site"],
      a: ["link-preview-link"],
      img: ["link-preview-image"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}

export function sanitizeCommentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "a", "code", "ul", "ol", "li"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}
