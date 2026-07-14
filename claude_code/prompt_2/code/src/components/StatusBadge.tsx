import { STATUS_LABELS, type ArticleStatus } from "@/lib/constants";

const classByStatus: Record<ArticleStatus, string> = {
  DRAFT: "badge badge-draft",
  IN_REVIEW: "badge badge-review",
  PUBLISHED: "badge badge-published",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = status as ArticleStatus;
  return <span className={classByStatus[s] ?? "badge badge-draft"}>{STATUS_LABELS[s] ?? status}</span>;
}
