import { useCallback, useEffect, useState } from 'react';
import { supabase, type Article, type ArticleStatus } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { RichTextEditor } from '../components/RichTextEditor';
import { ArrowLeft, Save, Send, Eye, EyeOff, Trash2, Loader2, X, Tag as TagIcon } from 'lucide-react';

interface Props {
  articleId: string | null;
  onDone: (id: string) => void;
  onBack: () => void;
}

export function ArticleEditorPage({ articleId, onDone, onBack }: Props) {
  const { user, isEditor } = useAuth();
  const toast = useToast();
  const isNew = !articleId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!articleId) return;
    const { data, error } = await supabase.from('articles').select('*').eq('id', articleId).maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (!data) { toast.error('Article not found.'); onBack(); return; }
    const a = data as Article;
    if (!isEditor && a.author_id !== user?.id) { toast.error('You can only edit your own articles.'); onBack(); return; }
    setTitle(a.title);
    setContent(a.content);
    setExcerpt(a.excerpt);
    setCoverImage(a.cover_image_url || '');
    setTags(a.tags || []);
    setStatus(a.status);
    setLoading(false);
  }, [articleId, user, isEditor, toast, onBack]);

  useEffect(() => { load(); }, [load]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const buildPayload = (nextStatus: ArticleStatus) => {
    const payload: Record<string, unknown> = {
      title: title.trim() || 'Untitled',
      content,
      excerpt: excerpt.trim(),
      cover_image_url: coverImage.trim() || null,
      tags,
      status: nextStatus,
    };
    if (nextStatus === 'published' && status !== 'published') {
      payload.published_at = new Date().toISOString();
    }
    if (nextStatus !== 'published') {
      // keep published_at if it was already published; only clear when explicitly unpublishing handled by caller
    }
    return payload;
  };

  const save = async (nextStatus: ArticleStatus) => {
    if (!user) return;
    if (!title.trim()) { toast.error('Please add a title.'); return; }
    if (!content.trim()) { toast.error('Please add some content.'); return; }
    setSaving(true);
    try {
      const payload = buildPayload(nextStatus);
      if (isNew) {
        const { data, error } = await supabase.from('articles').insert({ ...payload, author_id: user.id }).select().single();
        if (error) throw error;
        toast.success(nextStatus === 'published' ? 'Article published.' : nextStatus === 'review' ? 'Sent for review.' : 'Draft saved.');
        onDone((data as Article).id);
      } else {
        const { error } = await supabase.from('articles').update(payload).eq('id', articleId!);
        if (error) throw error;
        setStatus(nextStatus);
        toast.success(nextStatus === 'published' ? 'Article published.' : nextStatus === 'review' ? 'Sent for review.' : 'Saved.');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async () => {
    if (!articleId) return;
    if (!confirm('Unpublish this article? It will revert to draft and be hidden from readers.')) return;
    setSaving(true);
    const { error } = await supabase.from('articles').update({ status: 'draft', published_at: null }).eq('id', articleId);
    setSaving(false);
    if (error) toast.error(error.message);
    else { setStatus('draft'); toast.success('Article unpublished.'); }
  };

  const remove = async () => {
    if (!articleId) return;
    if (!confirm('Delete this article permanently?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', articleId);
    if (error) { toast.error(error.message); return; }
    toast.success('Article deleted.');
    onBack();
  };

  const canPublish = isEditor;
  const isCurrentPublished = status === 'published';

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in-up">
      <button onClick={onBack} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-stone-900 mb-6">{isNew ? 'New article' : 'Edit article'}</h1>

      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input text-lg" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="An attention-grabbing headline" />
        </div>

        <div>
          <label className="label" htmlFor="cover">Cover image URL <span className="text-stone-400 font-normal">(optional)</span></label>
          <input id="cover" className="input" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://images.example.com/cover.jpg" />
          {coverImage && <img src={coverImage} alt="" className="mt-2 rounded-lg max-h-40 object-cover" />}
        </div>

        <div>
          <label className="label" htmlFor="excerpt">Excerpt <span className="text-stone-400 font-normal">(optional)</span></label>
          <textarea id="excerpt" className="input min-h-[80px]" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A short summary shown in listings." />
        </div>

        <div>
          <label className="label">Tags</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <TagIcon className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                className="input pl-9"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter"
              />
            </div>
            <button type="button" onClick={addTag} className="btn-secondary">Add</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((t) => (
                <span key={t} className="badge bg-amber-50 text-amber-700">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-amber-900"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Content</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Write your story…" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
          <button onClick={() => save('draft')} disabled={saving} className="btn-secondary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save draft</>}
          </button>
          <button onClick={() => save('review')} disabled={saving} className="btn-secondary">
            <Send className="h-4 w-4" /> Submit for review
          </button>
          {canPublish && (
            <button onClick={() => save('published')} disabled={saving} className="btn-primary">
              <Eye className="h-4 w-4" /> {isCurrentPublished ? 'Update & keep published' : 'Publish'}
            </button>
          )}
          {isCurrentPublished && canPublish && (
            <button onClick={unpublish} disabled={saving} className="btn-ghost text-stone-600">
              <EyeOff className="h-4 w-4" /> Unpublish
            </button>
          )}
          {!isNew && (
            <button onClick={remove} disabled={saving} className="btn-ghost text-rose-600 hover:bg-rose-50 ml-auto">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>

        {!canPublish && (
          <p className="text-xs text-stone-400">Submitting for review sends the article to an editor, who can publish it.</p>
        )}
      </div>
    </div>
  );
}
