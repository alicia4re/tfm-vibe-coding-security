import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDashboardArticles } from "@/lib/articleQueries";
import PanelArticleRow from "./PanelArticleRow";

export const metadata = { title: "Panel — Multiblog" };
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");
  if (user.role !== "AUTHOR" && user.role !== "EDITOR") redirect("/");

  const articles = await getDashboardArticles(user);
  const inReview = articles.filter((a) => a.status === "IN_REVIEW");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {user.role === "EDITOR" ? "Panel de edición" : "Mis artículos"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {user.role === "EDITOR"
              ? "Revisa, publica y despublica artículos de cualquier autor."
              : "Crea, edita y envía tus artículos a revisión."}
          </p>
        </div>
        <Link href="/panel/articulos/nuevo" className="btn btn-primary">
          Nuevo artículo
        </Link>
      </div>

      {user.role === "EDITOR" && inReview.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Pendientes de revisión ({inReview.length})</h2>
          <div className="card divide-y divide-border">
            {inReview.map((article) => (
              <PanelArticleRow key={article.id} article={article} currentUserId={user.id} role={user.role} />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">
        {user.role === "EDITOR" ? "Todos los artículos" : "Todos mis artículos"}
      </h2>
      {articles.length === 0 ? (
        <p className="text-muted">Todavía no hay artículos. Crea el primero.</p>
      ) : (
        <div className="card divide-y divide-border">
          {articles.map((article) => (
            <PanelArticleRow key={article.id} article={article} currentUserId={user.id} role={user.role} />
          ))}
        </div>
      )}
    </div>
  );
}
