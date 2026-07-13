import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, type ArticleWithAuthor, type CommentWithAuthor } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { SafeHtml } from '../components/SafeHtml';
import { ArticleLinkPreviews } from '../components/ArticleLinkPreviews';
import { RichTextEditor } from '../components/RichTextEditor';
import { ArrowLeft, Clock, Tag, Pencil, Trash2, Send, Loader2, MessageCircle } from 'lucide-react';

interface Props {
  articleId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export function ArticleViewPage({ articleId, onBack, onEdit }: Props) {
  const { user, isEditor } = useAuth();
  const toast = useToast();
  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);

  const loadArticle = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:profiles!articles_author_id_fkey(id, display_name, email)')
      .eq('id', articleId)
      .maybeSingle();
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (!data) { setNotFound(true); setLoading(false); return; }
    setArticle(data as ArticleWithAuthor);
    setLoading(false);
  }, [articleId, toast]);

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, display_name, email)')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return; }
    setComments((data || []) as CommentWithAuthor[]);
  }, [articleId]);

  useEffect(() => { loadArticle(); loadComments(); }, [loadArticle, loadComments]);

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from('comments').insert({
      article_id: articleId,
      author_id: user.id,
      body: commentBody.trim(),
    });
    if (error) toast.error(error.message);
    else {
      setCommentBody('');
      toast.success('Comment posted.');
      loadComments();
    }
    setPosting(false);
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Comment deleted.'); loadComments(); }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-stone-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (notFound || !article) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-stone-500 mb-4">This article is not available.</p>
      <button onClick={onBack} className="btn-secondary">Back to home</button>
    </div>
  );

  const canEdit = isEditor || user?.id === article.author_id;
  const isPublished = article.status === 'published';

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in-up">
      <button onClick={onBack} className="btn-ghost mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {!isPublished && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          This article is <span className="font-semibold">{article.status === 'review' ? 'in review' : 'a draft'}</span> — only you and editors can see it.
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
        <span className="font-medium text-stone-700">{article.author?.display_name || article.author?.email || 'Anonymous'}</span>
        <span>·</span>
        <span>{formatDate(article.published_at || article.created_at)}</span>
        {canEdit && (
          <button onClick={() => onEdit(article.id)} className="ml-auto btn-ghost text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 leading-tight mb-4">{article.title}</h1>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {article.tags.map((t) => <span key={t} className="badge bg-amber-50 text-amber-700"><Tag className="h-3 w-3" />{t}</span>)}
        </div>
      )}

      {article.cover_image_url && (
        <img src={article.cover_image_url} alt={article.title} className="rounded-xl w-full h-auto mb-8" />
      )}

      <div className="prose-article">
        <SafeHtml html={article.content} />
      </div>

      <ArticleLinkPreviews html={article.content} />

      {/* Comments */}
      <section className="mt-12 pt-8 border-t border-stone-200">
        <h2 className="flex items-center gap-2 text-xl font-bold text-stone-900 mb-6">
          <MessageCircle className="h-5 w-5" /> Comments ({comments.length})
        </h2>

        {user ? (
          <form onSubmit={submitComment} className="mb-8">
            <RichTextEditor value={commentBody} onChange={setCommentBody} placeholder="Share your thoughts…" />
            <button type="submit" disabled={posting || !commentBody.trim()} className="btn-primary mt-3">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Post comment</>}
            </button>
          </form>
        ) : (
          <div className="rounded-lg bg-stone-100 p-4 text-sm text-stone-600 mb-8">
            Sign in to leave a comment.
          </div>
        )}

        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {(c.author?.display_name || c.author?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-stone-800">{c.author?.display_name || c.author?.email || 'Anonymous'}</span>
                  <span className="text-xs text-stone-400">{formatDate(c.created_at)}</span>
                  {(isEditor || user?.id === c.author_id) && (
                    <button onClick={() => deleteComment(c.id)} className="ml-auto text-stone-400 hover:text-rose-600 transition" aria-label="Delete comment">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="prose-article text-sm">
                  <SafeHtml html={c.body} />
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-stone-400">No comments yet. Be the first to share your thoughts.</p>}
        </div>
      </section>
    </article>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
