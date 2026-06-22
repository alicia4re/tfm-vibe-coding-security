import { useState, type ReactNode } from 'react';
import {
  CheckSquare, LogOut, ListTodo, ShieldCheck, Menu, X, User as UserIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Props {
  current: 'tasks' | 'admin';
  onNavigate: (v: 'tasks' | 'admin') => void;
  children: ReactNode;
}

export function AppShell({ current, onNavigate, children }: Props) {
  const { profile, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toast = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.info('Sesión cerrada.');
  };

  const navItems = [
    { id: 'tasks' as const, label: 'Tareas', icon: ListTodo },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Administración', icon: ShieldCheck }] : []),
  ];

  const go = (v: 'tasks' | 'admin') => {
    onNavigate(v);
    setMobileOpen(false);
  };

  const initials = (profile?.email ?? '?')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">Taskflow</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white p-4 shadow-pop animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Menú</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav items={navItems} current={current} onNavigate={go} />
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white p-4 lg:flex">
          <div className="flex items-center gap-2.5 px-2 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">Taskflow</div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Gestión de tareas</div>
            </div>
          </div>

          <nav className="mt-2 flex-1">
            <SidebarNav items={navItems} current={current} onNavigate={go} />
          </nav>

          <div className="border-t border-ink-100 pt-3">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-sm font-semibold text-ink-600">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink-800">{profile?.email}</div>
                <div className="flex items-center gap-1 text-xs text-ink-400">
                  {profile?.role === 'admin' ? (
                    <><ShieldCheck className="h-3 w-3" /> Administrador</>
                  ) : (
                    <><UserIcon className="h-3 w-3" /> Usuario</>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleSignOut} className="btn-secondary mt-1 w-full justify-start gap-2">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
          {/* Mobile sign out */}
          <div className="border-t border-ink-200 px-4 py-4 lg:hidden">
            <button onClick={handleSignOut} className="btn-secondary w-full">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarNav({
  items,
  current,
  onNavigate,
}: {
  items: { id: 'tasks' | 'admin'; label: string; icon: React.ElementType }[];
  current: 'tasks' | 'admin';
  onNavigate: (v: 'tasks' | 'admin') => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
