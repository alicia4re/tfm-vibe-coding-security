import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatusBadge from "./StatusBadge";

export interface ArticleCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  author: { id: string; name: string };
  tags: { id: string; name: string }[];
}

export default function ArticleCard({ article, showStatus }: { article: ArticleCardData; showStatus?: boolean }) {
  const date = article.publishedAt ?? article.createdAt;

  return (
    <Link
      href={`/articulos/${article.slug}`}
      className="card flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImage} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {showStatus && <StatusBadge status={article.status} />}
          <span className="text-xs text-muted">{format(date, "d MMM yyyy", { locale: es })}</span>
        </div>
        <h2 className="font-semibold text-lg leading-snug">{article.title}</h2>
        {article.excerpt && <p className="text-sm text-muted line-clamp-2">{article.excerpt}</p>}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="text-sm text-muted">Por {article.author.name}</span>
          {article.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end">
              {article.tags.slice(0, 2).map((tag) => (
                <span key={tag.id} className="tag-chip">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
