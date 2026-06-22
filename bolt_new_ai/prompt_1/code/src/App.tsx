import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthPage } from './components/AuthPage';
import { AppShell } from './components/AppShell';
import { TasksPage } from './components/TasksPage';
import { AdminPage } from './components/AdminPage';
import { FullPageLoader } from './components/Spinner';

function AppContent() {
  const { user, profile, loading, isAdmin } = useAuth();
  const [view, setView] = useState<'tasks' | 'admin'>('tasks');

  if (loading) return <FullPageLoader />;
  if (!user || !profile) return <AuthPage />;

  if (!profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <span className="text-xl font-bold text-red-600">!</span>
          </div>
          <h1 className="text-lg font-semibold text-ink-900">Cuenta desactivada</h1>
          <p className="mt-2 text-sm text-ink-500">
            Tu cuenta ha sido desactivada por un administrador. Contacta con soporte para reactivarla.
          </p>
        </div>
      </div>
    );
  }

  // Guard: if user navigates to admin but isn't admin, fall back to tasks
  const currentView: 'tasks' | 'admin' = view === 'admin' && isAdmin ? 'admin' : 'tasks';

  return (
    <AppShell current={currentView} onNavigate={setView}>
      {currentView === 'admin' ? <AdminPage /> : <TasksPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
