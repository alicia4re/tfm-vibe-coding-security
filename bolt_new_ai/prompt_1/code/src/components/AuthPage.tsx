import { useState } from 'react';
import { CheckSquare, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { translateAuthError } from '../types';
import { Spinner } from './Spinner';

type Mode = 'login' | 'register' | 'recover';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoverSent, setRecoverSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Sesión iniciada.');
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Cuenta creada. Ya puedes iniciar sesión.');
        setMode('login');
        setPassword('');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset`,
        });
        if (error) throw error;
        setRecoverSent(true);
      }
    } catch (err) {
      toast.error(translateAuthError((err as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-950 to-sky-950" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <CheckSquare className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Taskflow</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Organiza tu trabajo,<br />una tarea a la vez.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-300">
              Gestiona tareas con prioridades, fechas límite y archivos adjuntos.
              Diseñado para equipos: con roles de usuario y panel de administración.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Filtros por estado y prioridad',
                'Búsqueda instantánea',
                'Panel de administración y estadísticas',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-ink-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-ink-400">El primer usuario registrado se convierte en administrador.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-ink-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">Taskflow</span>
            </div>
          </div>

          {mode === 'recover' && recoverSent ? (
            <div className="animate-slide-up text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-ink-900">Revisa tu correo</h2>
              <p className="mt-2 text-sm text-ink-500">
                Si existe una cuenta con <span className="font-medium text-ink-700">{email}</span>,
                te enviamos un enlace para restablecer tu contraseña.
              </p>
              <button
                onClick={() => { setMode('login'); setRecoverSent(false); }}
                className="btn-secondary mt-6 w-full"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-slide-up">
              <h2 className="text-2xl font-bold tracking-tight text-ink-900">
                {mode === 'login' && 'Bienvenido de nuevo'}
                {mode === 'register' && 'Crea tu cuenta'}
                {mode === 'recover' && 'Recuperar contraseña'}
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                {mode === 'login' && 'Inicia sesión para continuar a tu panel.'}
                {mode === 'register' && 'Regístrate para empezar a gestionar tareas.'}
                {mode === 'recover' && 'Te enviaremos un enlace por correo.'}
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="input pl-10"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {mode !== 'recover' && (
                  <div>
                    <label className="label" htmlFor="password">Contraseña</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        id="password"
                        type="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        required
                        minLength={6}
                        className="input pl-10"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-sky-50 px-3 py-2.5 text-xs text-sky-700">
                    <UserIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>El primer usuario en registrarse será administrador automáticamente.</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Spinner className="h-4 w-4" /> : null}
                  {mode === 'login' && (loading ? 'Iniciando…' : 'Iniciar sesión')}
                  {mode === 'register' && (loading ? 'Creando…' : 'Crear cuenta')}
                  {mode === 'recover' && (loading ? 'Enviando…' : 'Enviar enlace')}
                  {!loading && mode !== 'recover' && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-6 space-y-2 text-center text-sm">
                {mode === 'login' && (
                  <>
                    <button type="button" onClick={() => setMode('recover')} className="font-medium text-sky-600 hover:text-sky-700">
                      ¿Olvidaste tu contraseña?
                    </button>
                    <p className="text-ink-500">
                      ¿No tienes cuenta?{' '}
                      <button type="button" onClick={() => setMode('register')} className="font-semibold text-ink-900 hover:underline">
                        Regístrate
                      </button>
                    </p>
                  </>
                )}
                {mode === 'register' && (
                  <p className="text-ink-500">
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => setMode('login')} className="font-semibold text-ink-900 hover:underline">
                      Inicia sesión
                    </button>
                  </p>
                )}
                {mode === 'recover' && (
                  <button type="button" onClick={() => setMode('login')} className="font-medium text-ink-600 hover:text-ink-900">
                    Volver a iniciar sesión
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
