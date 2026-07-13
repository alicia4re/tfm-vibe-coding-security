import { useCallback, useEffect, useState } from 'react';
import { supabase, type ArticleWithAuthor } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { SafeHtml } from '../components/SafeHtml';
import { Clock, Eye, CheckCircle2, XCircle, Loader2, Inbox } from 'lucide-react';

export function ReviewQueuePage({ onOpen }: { onOpen: (id: string) => void }) {
  const { isEditor } = useAuth();
  const toast = useToast();
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:profiles!articles_author_id_fkey(id, display_name, email)')
      .eq('status', 'review')
      .order('updated_at', { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setArticles((data || []) as ArticleWithAuthor[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const publish = async (id: string) => {
    setActing(id);
    const { error } = await supabase.from('articles').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    setActing(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Article published.');
    load();
  };

  const reject = async (id: string) => {
    setActing(id);
    const { error } = await supabase.from('articles').update({ status: 'draft' }).eq('id', id);
    setActing(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Sent back to drafts.');
    load();
  };

  if (!isEditor) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-500">Only editors can access the review queue.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Review queue</h1>
      <p className="text-sm text-stone-500 mb-8">Articles submitted by authors, awaiting your editorial decision.</p>

      {loading ? (
        <div className="text-center py-16 text-stone-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : articles.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">The queue is empty. Nothing to review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                <span className="font-medium text-stone-700">{a.author?.display_name || a.author?.email}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {formatDate(a.updated_at)}</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1">{a.title}</h3>
              <div className="text-sm text-stone-600 line-clamp-3 mb-3">
                <SafeHtml html={a.excerpt || a.content} />
              </div>
              {a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {a.tags.map((t) => <span key={t} className="badge bg-amber-50 text-amber-700">{t}</span>)}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100">
                <button onClick={() => onOpen(a.id)} className="btn-ghost text-sm">
                  <Eye className="h-4 w-4" /> Read
                </button>
                <button onClick={() => publish(a.id)} disabled={acting === a.id} className="btn-primary text-sm">
                  {acting === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Publish</>}
                </button>
                <button onClick={() => reject(a.id)} disabled={acting === a.id} className="btn-secondary text-sm">
                  <XCircle className="h-4 w-4" /> Send back to draft
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
