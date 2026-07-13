import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { ArticleViewPage } from './pages/ArticleViewPage';
import { ArticleEditorPage } from './pages/ArticleEditorPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { ProfilePage } from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

type View =
  | { name: 'home' }
  | { name: 'auth'; mode: 'login' | 'register' | 'forgot' }
  | { name: 'reset' }
  | { name: 'article'; id: string }
  | { name: 'edit'; id: string | null }
  | { name: 'dashboard' }
  | { name: 'review' }
  | { name: 'profile' };

function parseHash(): View {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [path, ...rest] = h.split('/');
  switch (path) {
    case 'login': return { name: 'auth', mode: 'login' };
    case 'register': return { name: 'auth', mode: 'register' };
    case 'forgot': return { name: 'auth', mode: 'forgot' };
    case 'reset-password': return { name: 'reset' };
    case 'article': return { name: 'article', id: rest[0] || '' };
    case 'edit': return { name: 'edit', id: rest[0] || null };
    case 'new': return { name: 'edit', id: null };
    case 'dashboard': return { name: 'dashboard' };
    case 'review': return { name: 'review' };
    case 'profile': return { name: 'profile' };
    default: return { name: 'home' };
  }
}

function setHash(view: View) {
  let h = '#/';
  switch (view.name) {
    case 'auth': h = `#/${view.mode}`; break;
    case 'reset': h = '#/reset-password'; break;
    case 'article': h = `#/article/${view.id}`; break;
    case 'edit': h = view.id ? `#/edit/${view.id}` : '#/new'; break;
    case 'dashboard': h = '#/dashboard'; break;
    case 'review': h = '#/review'; break;
    case 'profile': h = '#/profile'; break;
    case 'home': h = '#/'; break;
  }
  if (window.location.hash !== h) window.location.hash = h;
}

function Shell() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>(parseHash());

  useEffect(() => {
    const onHash = () => setView(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((v: View) => {
    setHash(v);
    setView(v);
    window.scrollTo(0, 0);
  }, []);

  // Route guard: redirect auth pages when already signed in; redirect protected pages when signed out.
  useEffect(() => {
    if (loading) return;
    if (user && view.name === 'auth') navigate({ name: 'home' });
    if (!user && (view.name === 'dashboard' || view.name === 'review' || view.name === 'profile' || view.name === 'edit')) {
      navigate({ name: 'auth', mode: 'login' });
    }
  }, [user, loading, view, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  const navRoute = view.name === 'edit' ? 'new' : (view.name === 'article' ? 'home' : view.name);

  return (
    <div className="min-h-screen flex flex-col">
      {view.name !== 'auth' && view.name !== 'reset' && (
        <Navbar route={navRoute as 'home' | 'dashboard' | 'review' | 'profile' | 'new'} onNavigate={(r) => navigate(r === 'new' ? { name: 'edit', id: null } : { name: r })} />
      )}
      <main className="flex-1">
        {renderView(view, navigate)}
      </main>
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400">
        Inkwell — a multi-author blog
      </footer>
    </div>
  );
}

function renderView(view: View, navigate: (v: View) => void) {
  switch (view.name) {
    case 'auth': return <AuthPage initialMode={view.mode} />;
    case 'reset': return <ResetPasswordPage />;
    case 'home': return <HomePage onOpenArticle={(id) => navigate({ name: 'article', id })} onNewArticle={() => navigate({ name: 'edit', id: null })} />;
    case 'article': return <ArticleViewPage articleId={view.id} onBack={() => navigate({ name: 'home' })} onEdit={(id) => navigate({ name: 'edit', id })} />;
    case 'edit': return <ArticleEditorPage articleId={view.id} onDone={(id) => navigate({ name: 'article', id })} onBack={() => navigate({ name: 'dashboard' })} />;
    case 'dashboard': return <DashboardPage onNew={() => navigate({ name: 'edit', id: null })} onEdit={(id) => navigate({ name: 'edit', id })} />;
    case 'review': return <ReviewQueuePage onOpen={(id) => navigate({ name: 'article', id })} />;
    case 'profile': return <ProfilePage />;
    default: return null;
  }
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ToastProvider>
  );
}
