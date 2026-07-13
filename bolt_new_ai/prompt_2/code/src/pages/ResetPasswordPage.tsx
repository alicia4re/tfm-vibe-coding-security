import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { Feather, Lock, Loader2 } from 'lucide-react';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success('Password updated. You can now sign in.');
    } catch (err) {
      toast.error((err as Error).message || 'Could not update password.');
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
          {done ? (
            <div className="text-center py-4">
              <p className="text-stone-800 font-medium">Your password has been updated.</p>
              <a href="/" className="btn-primary mt-6 inline-flex">Go to sign in</a>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-stone-900 mb-1">Set a new password</h1>
              <p className="text-sm text-stone-500 mb-6">Choose a new password for your account.</p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="np">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input id="np" type="password" required minLength={6} className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
