import { useEffect, useState } from 'react';
import { Link2, Loader2, ExternalLink } from 'lucide-react';


interface Preview {
  title: string;
  url: string;
  image: string | null;
  description: string;
}

export function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-preview`;
    fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ url }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Preview failed');
        return data as Preview;
      })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading preview…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
        <Link2 className="h-4 w-4" />
        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">
          {url}
        </a>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block my-4 max-w-lg border border-stone-200 rounded-lg overflow-hidden hover:border-amber-400 hover:shadow-md transition group"
    >
      <div className="flex">
        {preview.image && (
          <div className="w-28 h-28 shrink-0 overflow-hidden bg-stone-100">
            <img src={preview.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <Link2 className="h-3 w-3" />
            <span className="truncate">{new URL(preview.url).hostname}</span>
            <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
          <p className="font-semibold text-sm text-stone-900 line-clamp-2 leading-snug">{preview.title}</p>
          {preview.description && (
            <p className="text-xs text-stone-500 line-clamp-2 mt-1">{preview.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}
