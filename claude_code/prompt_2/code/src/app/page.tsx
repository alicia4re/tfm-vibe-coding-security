import { getPublishedArticles } from "@/lib/articleQueries";
import ArticleCard from "@/components/ArticleCard";
import SearchBar from "@/components/SearchBar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const articles = await getPublishedArticles(q?.trim());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Multiblog</h1>
        <p className="text-muted max-w-2xl">
          Artículos escritos por varios autores. Regístrate para comentar, o crea una cuenta de autor para publicar
          los tuyos.
        </p>
      </div>

      <div className="mb-8 max-w-md">
        <SearchBar defaultValue={q} />
      </div>

      {articles.length === 0 ? (
        <p className="text-muted">
          {q ? `No se encontraron artículos para "${q}".` : "Todavía no hay artículos publicados."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
