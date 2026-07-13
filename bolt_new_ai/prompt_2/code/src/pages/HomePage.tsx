import { useEffect, useMemo, useState } from 'react';
import { supabase, type ArticleWithAuthor } from '../lib/supabase';
import { Search, Feather, Clock, Tag } from 'lucide-react';
import { SafeHtml } from '../components/SafeHtml';

export function HomePage({ onOpenArticle, onNewArticle }: { onOpenArticle: (id: string) => void; onNewArticle: () => void }) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*, author:profiles!articles_author_id_fkey(id, display_name, email)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (!cancelled) {
        if (error) console.error(error);
        setArticles((data || []) as ArticleWithAuthor[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    if (!query && !activeTag) return articles;
    const q = query.toLowerCase();
    return articles.filter((a) => {
      const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !activeTag || a.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [articles, query, activeTag]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium mb-4">
          <Feather className="h-3.5 w-3.5" /> Stories worth reading
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-stone-900 mb-3">Inkwell</h1>
        <p className="text-lg text-stone-500 max-w-xl mx-auto">A multi-author blog where writers draft, editors curate, and readers discover.</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
        <input
          className="input pl-9"
          placeholder="Search by title, content, or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveTag(null)}
            className={`badge transition ${!activeTag ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? null : t)}
              className={`badge transition ${activeTag === t ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              <Tag className="h-3 w-3" /> {t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-stone-200 rounded w-1/3 mb-3" /><div className="h-6 bg-stone-200 rounded w-3/4 mb-2" /><div className="h-4 bg-stone-100 rounded w-full" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg mb-4">No articles found.</p>
          <button onClick={onNewArticle} className="btn-secondary">Write the first one</button>
        </div>
      ) : (
        <div className="space-y-8">
          {featured && <FeaturedCard article={featured} onOpen={onOpenArticle} />}
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((a) => <ArticleCard key={a.id} article={a} onOpen={onOpenArticle} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ article, onOpen }: { article: ArticleWithAuthor; onOpen: (id: string) => void }) {
  return (
    <article
      onClick={() => onOpen(article.id)}
      className="card overflow-hidden cursor-pointer hover:shadow-md transition group animate-fade-in-up"
    >
      {article.cover_image_url && (
        <div className="h-56 sm:h-64 overflow-hidden bg-stone-100">
          <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <span>{article.author?.display_name || 'Anonymous'}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(article.published_at || article.created_at)}</span>
        </div>
        <h2 className="text-2xl font-bold font-serif text-stone-900 group-hover:text-amber-700 transition-colors mb-2">{article.title}</h2>
        {article.excerpt && <p className="text-stone-600 line-clamp-2">{article.excerpt}</p>}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {article.tags.map((t) => <span key={t} className="badge bg-amber-50 text-amber-700">{t}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}

function ArticleCard({ article, onOpen }: { article: ArticleWithAuthor; onOpen: (id: string) => void }) {
  return (
    <article
      onClick={() => onOpen(article.id)}
      className="card p-5 cursor-pointer hover:shadow-md transition group animate-fade-in-up flex flex-col"
    >
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
        <span>{article.author?.display_name || 'Anonymous'}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(article.published_at || article.created_at)}</span>
      </div>
      <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors mb-1.5">{article.title}</h3>
      {article.excerpt ? (
        <p className="text-sm text-stone-600 line-clamp-2 flex-1">{article.excerpt}</p>
      ) : (
        <div className="text-sm text-stone-500 line-clamp-2 flex-1">
          <SafeHtml html={article.content} />
        </div>
      )}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {article.tags.map((t) => <span key={t} className="badge bg-amber-50 text-amber-700">{t}</span>)}
        </div>
      )}
    </article>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
