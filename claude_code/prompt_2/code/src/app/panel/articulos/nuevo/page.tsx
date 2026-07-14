import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createArticleAction } from "@/lib/actions/articles";
import ArticleForm from "@/components/ArticleForm";

export const metadata = { title: "Nuevo artículo — Multiblog" };

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");
  if (user.role !== "AUTHOR" && user.role !== "EDITOR") redirect("/");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Nuevo artículo</h1>
      <ArticleForm action={createArticleAction} submitLabel="Crear artículo" />
    </div>
  );
}
