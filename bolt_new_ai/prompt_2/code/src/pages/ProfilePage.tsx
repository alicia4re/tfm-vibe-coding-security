import { useEffect, useState, type FormEvent } from 'react';
import { supabase, type UserRole } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { Copy, RefreshCw, Loader2, KeyRound, Shield, Eye, EyeOff, UserCircle, Check } from 'lucide-react';

const ROLE_META: Record<UserRole, { label: string; cls: string }> = {
  reader: { label: 'Reader', cls: 'bg-sky-100 text-sky-800' },
  author: { label: 'Author', cls: 'bg-amber-100 text-amber-800' },
  editor: { label: 'Editor', cls: 'bg-emerald-100 text-emerald-800' },
};

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio);
    }
  }, [profile]);

  if (!profile) return null;
  const role = ROLE_META[profile.role];

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim(), bio: bio.trim() }).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success('Profile updated.');
  };

  const copyToken = () => {
    navigator.clipboard.writeText(profile.api_token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const regenerate = async () => {
    if (!confirm('Generate a new API token? Your current token will stop working immediately.')) return;
    setRegenerating(true);
    const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const { error } = await supabase.from('profiles').update({ api_token: newToken }).eq('id', profile.id);
    setRegenerating(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success('New API token generated.');
  };

  const apiExample = `curl -H "Authorization: Bearer ${profile.api_token.slice(0, 8)}…" \\\n  ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Profile & settings</h1>
      <p className="text-sm text-stone-500 mb-8">Manage your identity, role, and API access.</p>

      {/* Identity card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            {(profile.display_name || profile.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{profile.display_name || profile.email}</p>
            <p className="text-sm text-stone-500">{profile.email}</p>
            <span className={`badge ${role.cls} mt-1.5`}>
              {profile.role === 'editor' ? <Shield className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />} {role.label}
            </span>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label" htmlFor="dn">Display name</label>
            <input id="dn" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea id="bio" className="input min-h-[90px]" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio shown alongside your articles." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
          </button>
        </form>
      </div>

      {/* API token card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-stone-900">Public API token</h2>
        </div>
        <p className="text-sm text-stone-500 mb-4">
          Use this token to fetch published articles from the read-only public API. Keep it private.
        </p>

        <div className="flex items-stretch gap-2 mb-3">
          <code className="flex-1 rounded-lg bg-stone-900 text-stone-100 px-3 py-2 text-sm font-mono overflow-x-auto whitespace-nowrap">
            {showToken ? profile.api_token : '•'.repeat(32)}
          </code>
          <button onClick={() => setShowToken((s) => !s)} className="btn-secondary" aria-label={showToken ? 'Hide token' : 'Show token'}>
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button onClick={copyToken} className="btn-secondary" aria-label="Copy token">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <button onClick={regenerate} disabled={regenerating} className="btn-ghost text-sm">
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4" /> Regenerate token</>}
        </button>

        <div className="mt-5">
          <p className="text-xs font-medium text-stone-600 mb-1.5">Example request</p>
          <pre className="rounded-lg bg-stone-900 text-stone-100 p-3 text-xs overflow-x-auto font-mono">{apiExample}</pre>
        </div>
      </div>
    </div>
  );
}
