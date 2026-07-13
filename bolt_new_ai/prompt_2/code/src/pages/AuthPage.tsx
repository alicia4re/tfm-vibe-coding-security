import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { Feather, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot';

function errorMessage(err: { message?: string } | null, fallback: string): string {
  const m = err?.message || '';
  if (m.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('User already registered')) return 'An account with this email already exists.';
  if (m.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  return m || fallback;
}

export function AuthPage({ initialMode = 'login' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Set display name in user metadata via profile update after trigger creates the row.
          await supabase
            .from('profiles')
            .update({ display_name: displayName || email.split('@')[0] })
            .eq('id', data.user.id);
        }
        toast.success('Account created. You are signed in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
        toast.success('Password reset email sent.');
      }
    } catch (err) {
      toast.error(errorMessage(err as { message?: string } | null, 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-amber-50/40 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
            <Feather className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold font-serif text-stone-900">Inkwell</span>
        </div>

        <div className="card p-7">
          <h1 className="text-xl font-bold text-stone-900 mb-1">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset your password'}
          </h1>
          <p className="text-sm text-stone-500 mb-6">
            {mode === 'login'
              ? 'Sign in to read, write, and comment.'
              : mode === 'register'
              ? 'The very first account becomes the editor.'
              : 'We will email you a secure link to set a new password.'}
          </p>

          {sent ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              Check your inbox at <span className="font-semibold">{email}</span> for a password reset link.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="label" htmlFor="name">Display name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input id="name" className="input pl-9" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Writer" />
                  </div>
                </div>
              )}
              <div>
                <label className="label" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input id="email" type="email" required className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              {mode !== 'forgot' && (
                <div>
                  <label className="label" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input id="password" type="password" required minLength={6} className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-sm text-stone-500 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <p>
                  No account?{' '}
                  <button onClick={() => setMode('register')} className="text-amber-700 font-medium hover:underline">Sign up</button>
                </p>
                <p>
                  <button onClick={() => setMode('forgot')} className="text-stone-500 hover:text-stone-700 hover:underline">Forgot password?</button>
                </p>
              </>
            )}
            {mode === 'register' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-amber-700 font-medium hover:underline">Sign in</button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                <button onClick={() => setMode('login')} className="text-amber-700 font-medium hover:underline">Back to sign in</button>
              </p>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-stone-400 mt-6">Inkwell — a multi-author blog</p>
      </div>
    </div>
  );
}
