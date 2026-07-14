import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string };
}

export default function CommentList({ comments }: { comments: CommentData[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay comentarios. ¡Sé el primero en comentar!</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: es })}
            </span>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        </li>
      ))}
    </ul>
  );
}
