import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatusBadge from "@/components/StatusBadge";
import {
  submitForReviewAction,
  withdrawFromReviewAction,
  publishArticleAction,
  unpublishArticleAction,
} from "@/lib/actions/articles";
import type { Role } from "@/lib/constants";
import type { ArticleCardData } from "@/components/ArticleCard";

export default function PanelArticleRow({
  article,
  currentUserId,
  role,
}: {
  article: ArticleCardData;
  currentUserId: string;
  role: Role;
}) {
  const isOwner = article.author.id === currentUserId;
  const isEditor = role === "EDITOR";
  const date = article.publishedAt ?? article.updatedAt;

  return (
    <div className="p-4 flex flex-wrap items-center gap-3 justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <StatusBadge status={article.status} />
          <span className="text-xs text-muted">{format(date, "d MMM yyyy", { locale: es })}</span>
        </div>
        <Link href={`/articulos/${article.slug}`} className="font-medium hover:text-primary truncate block">
          {article.title}
        </Link>
        {isEditor && <span className="text-xs text-muted">Por {article.author.name}</span>}
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Link href={`/panel/articulos/${article.id}`} className="btn btn-secondary">
          Editar
        </Link>
        {isOwner && article.status === "DRAFT" && (
          <form action={submitForReviewAction.bind(null, article.id)}>
            <button type="submit" className="btn btn-primary">
              Enviar a revisión
            </button>
          </form>
        )}
        {isOwner && article.status === "IN_REVIEW" && (
          <form action={withdrawFromReviewAction.bind(null, article.id)}>
            <button type="submit" className="btn btn-secondary">
              Retirar
            </button>
          </form>
        )}
        {isEditor && (article.status === "IN_REVIEW" || article.status === "DRAFT") && (
          <form action={publishArticleAction.bind(null, article.id)}>
            <button type="submit" className="btn btn-primary">
              Publicar
            </button>
          </form>
        )}
        {isEditor && article.status === "PUBLISHED" && (
          <form action={unpublishArticleAction.bind(null, article.id)}>
            <button type="submit" className="btn btn-secondary">
              Despublicar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
