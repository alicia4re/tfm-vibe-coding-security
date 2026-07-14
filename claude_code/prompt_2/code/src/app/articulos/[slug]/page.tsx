import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getArticleBySlugForViewer } from "@/lib/articleQueries";
import { getCurrentUser } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import ArticleWorkflowActions from "@/components/ArticleWorkflowActions";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const article = await getArticleBySlugForViewer(slug, user);
  if (!article) notFound();

  const date = article.publishedAt ?? article.createdAt;
  const isPreview = article.status !== "PUBLISHED";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {isPreview && user && (article.authorId === user.id || user.role === "EDITOR") && (
        <div className="mb-6">
          <ArticleWorkflowActions article={article} user={user} />
        </div>
      )}

      <article>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {isPreview && <StatusBadge status={article.status} />}
          <span className="text-sm text-muted">{format(date, "d MMMM yyyy", { locale: es })}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{article.title}</h1>
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-sm text-muted">Por {article.author.name}</span>
          {article.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {article.tags.map((tag) => (
                <Link key={tag.id} href={`/?q=${encodeURIComponent(tag.name)}`} className="tag-chip">
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImage} alt="" className="w-full max-h-96 object-cover rounded-xl mb-8" />
        )}

        <div
          className="prose-article prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      {article.status === "PUBLISHED" && (
        <section className="mt-14 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold mb-4">
            Comentarios {article.comments.length > 0 && `(${article.comments.length})`}
          </h2>
          {user ? (
            <div className="mb-8">
              <CommentForm articleId={article.id} />
            </div>
          ) : (
            <div className="alert alert-error mb-8 !bg-transparent border-border text-muted">
              <Link href="/iniciar-sesion" className="text-primary font-medium">
                Inicia sesión
              </Link>{" "}
              para comentar este artículo.
            </div>
          )}
          <CommentList comments={article.comments} />
        </section>
      )}
    </div>
  );
}
