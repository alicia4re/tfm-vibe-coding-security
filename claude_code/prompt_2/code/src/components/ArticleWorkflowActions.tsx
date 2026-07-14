import Link from "next/link";
import {
  submitForReviewAction,
  withdrawFromReviewAction,
  publishArticleAction,
  unpublishArticleAction,
  deleteArticleAction,
} from "@/lib/actions/articles";
import type { CurrentUser } from "@/lib/session";

export default function ArticleWorkflowActions({
  article,
  user,
  hideEditLink,
}: {
  article: { id: string; status: string; authorId: string };
  user: CurrentUser;
  hideEditLink?: boolean;
}) {
  const isOwner = article.authorId === user.id;
  const isEditor = user.role === "EDITOR";
  if (!isOwner && !isEditor) return null;

  return (
    <div className="card p-4 flex flex-wrap items-center gap-2">
      {!hideEditLink && (
        <Link href={`/panel/articulos/${article.id}`} className="btn btn-secondary">
          Editar
        </Link>
      )}

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
            Retirar de revisión
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
      {(isOwner || isEditor) && (
        <form
          action={deleteArticleAction.bind(null, article.id)}
          className="ml-auto"
        >
          <button type="submit" className="btn btn-danger">
            Eliminar
          </button>
        </form>
      )}
    </div>
  );
}
