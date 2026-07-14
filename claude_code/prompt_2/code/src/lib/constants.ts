export const ROLES = ["READER", "AUTHOR", "EDITOR"] as const;
export type Role = (typeof ROLES)[number];

export const ARTICLE_STATUSES = ["DRAFT", "IN_REVIEW", "PUBLISHED"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  READER: "Lector",
  AUTHOR: "Autor",
  EDITOR: "Editor",
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En revisión",
  PUBLISHED: "Publicado",
};
