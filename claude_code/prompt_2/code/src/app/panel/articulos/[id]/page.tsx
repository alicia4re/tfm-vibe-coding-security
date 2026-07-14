import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getArticleForEdit } from "@/lib/articleQueries";
import { updateArticleAction } from "@/lib/actions/articles";
import ArticleForm from "@/components/ArticleForm";
import ArticleWorkflowActions from "@/components/ArticleWorkflowActions";

export const metadata = { title: "Editar artículo — Multiblog" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");

  const article = await getArticleForEdit(id, user);
  if (!article) notFound();

  const action = updateArticleAction.bind(null, article.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Editar artículo</h1>
      <div className="mb-8">
        <ArticleWorkflowActions article={article} user={user} hideEditLink />
      </div>
      <ArticleForm
        action={action}
        submitLabel="Guardar cambios"
        initialValues={{
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          coverImage: article.coverImage ?? "",
          tags: article.tags.map((t) => t.name).join(", "),
        }}
      />
    </div>
  );
}
