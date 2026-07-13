import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Feather, Home, LayoutDashboard, ClipboardCheck, UserCircle, LogOut, Menu, X, PenSquare } from 'lucide-react';

type Route = 'home' | 'dashboard' | 'review' | 'profile' | 'new';

interface Props {
  route: Route;
  onNavigate: (r: Route) => void;
}

export function Navbar({ route, onNavigate }: Props) {
  const { user, profile, isEditor, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const go = (r: Route) => { onNavigate(r); setOpen(false); };

  const links: { id: Route; label: string; icon: typeof Home; show: boolean }[] = [
    { id: 'home', label: 'Articles', icon: Home, show: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: !!user },
    { id: 'review', label: 'Review queue', icon: ClipboardCheck, show: isEditor },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <button onClick={() => go('home')} className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
            <Feather className="h-4 w-4" />
          </div>
          <span className="font-bold font-serif text-lg text-stone-900">Inkwell</span>
        </button>

        <nav className="hidden sm:flex items-center gap-1 ml-4">
          {links.filter((l) => l.show).map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                route === l.id ? 'bg-amber-50 text-amber-800' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <button onClick={() => go('new')} className="btn-primary hidden sm:inline-flex text-sm">
              <PenSquare className="h-4 w-4" /> Write
            </button>
          )}

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => go('profile')} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 transition">
                <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold">
                  {(profile?.display_name || profile?.email || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-stone-700 max-w-[120px] truncate">{profile?.display_name || profile?.email}</span>
              </button>
              <button onClick={signOut} className="btn-ghost p-2" aria-label="Sign out" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => go('home')} className="btn-primary hidden sm:inline-flex text-sm">Sign in</button>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setOpen((o) => !o)} className="sm:hidden btn-ghost p-2" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-stone-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.filter((l) => l.show).map((l) => (
              <button key={l.id} onClick={() => go(l.id)} className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium ${route === l.id ? 'bg-amber-50 text-amber-800' : 'text-stone-700 hover:bg-stone-100'}`}>
                <l.icon className="h-4 w-4" /> {l.label}
              </button>
            ))}
            {user && (
              <button onClick={() => go('new')} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100">
                <PenSquare className="h-4 w-4" /> Write
              </button>
            )}
            {user ? (
              <>
                <button onClick={() => go('profile')} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100">
                  <UserCircle className="h-4 w-4" /> Profile
                </button>
                <button onClick={() => { signOut(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <button onClick={() => go('home')} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-amber-700 hover:bg-amber-50">
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
