import { useCallback, useEffect, useState } from 'react';
import { supabase, type Article, type ArticleStatus } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { Plus, Pencil, Clock, CheckCircle2, Loader2, FileText } from 'lucide-react';

const STATUS_META: Record<ArticleStatus, { label: string; cls: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', cls: 'bg-stone-100 text-stone-600', icon: FileText },
  review: { label: 'In review', cls: 'bg-amber-100 text-amber-800', icon: Clock },
  published: { label: 'Published', cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
};

export function DashboardPage({ onNew, onEdit }: { onNew: () => void; onEdit: (id: string) => void }) {
  const { user, isEditor } = useAuth();
  const toast = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('articles').select('*').order('updated_at', { ascending: false });
    if (!isEditor) query = query.eq('author_id', user.id);
    const { data, error } = await query;
    if (error) { toast.error(error.message); setLoading(false); return; }
    setArticles((data || []) as Article[]);
    setLoading(false);
  }, [user, isEditor, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{isEditor ? 'All articles' : 'My articles'}</h1>
          <p className="text-sm text-stone-500 mt-1">{isEditor ? 'Every article in the system, across all authors.' : 'Drafts, submissions, and published posts.'}</p>
        </div>
        <button onClick={onNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New article
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : articles.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-stone-500 mb-4">You haven't written any articles yet.</p>
          <button onClick={onNew} className="btn-primary"><Plus className="h-4 w-4" /> Write your first article</button>
        </div>
      ) : (
        <div className="card divide-y divide-stone-100">
          {articles.map((a) => {
            const meta = STATUS_META[a.status];
            const Icon = meta.icon;
            return (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-stone-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${meta.cls}`}><Icon className="h-3 w-3" /> {meta.label}</span>
                    {isEditor && a.author_id !== user?.id && <span className="text-xs text-stone-400">by another author</span>}
                  </div>
                  <h3 className="font-semibold text-stone-900 truncate">{a.title}</h3>
                  <p className="text-xs text-stone-400">Updated {formatDate(a.updated_at)}</p>
                </div>
                <button onClick={() => onEdit(a.id)} className="btn-ghost shrink-0">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
