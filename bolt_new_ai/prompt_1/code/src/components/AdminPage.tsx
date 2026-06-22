import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, Shield, ShieldCheck, ShieldX, Power, Users, BarChart3,
  TrendingUp, Loader2, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from './Spinner';
import { StatusBadge } from './Badges';
import { STATUS_LABELS } from '../types';
import type { Profile, TaskStatus, UserRole } from '../types';

interface UserStat {
  id: string;
  email: string;
  full_name: string | null;
  task_count: number;
}

export function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<TaskStatus, number>>({ pendiente: 0, en_curso: 0, completada: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: p }, { data: stats }, { data: counts }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase.rpc('user_task_stats'),
        supabase.rpc('task_counts_by_status'),
      ]);

      setProfiles((p as Profile[]) ?? []);
      setUserStats((stats as UserStat[]) ?? []);
      const c = (counts as Record<string, number>) ?? {};
      setStatusCounts({
        pendiente: c.pendiente ?? 0,
        en_curso: c.en_curso ?? 0,
        completada: c.completada ?? 0,
      });
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo cargar el panel.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => !q || p.email.toLowerCase().includes(q));
  }, [profiles, search]);

  const getStats = (id: string): UserStat | undefined => userStats.find((s) => s.id === id);
  const totalTasks = statusCounts.pendiente + statusCounts.en_curso + statusCounts.completada;

  const handleRoleChange = async (profile: Profile, role: UserRole) => {
    setActionLoading(profile.id);
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', profile.id);
      if (error) throw error;
      toast.success(`Rol actualizado a ${role === 'admin' ? 'administrador' : 'usuario'}.`);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo cambiar el rol.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (profile: Profile) => {
    setActionLoading(profile.id);
    const next = !profile.is_active;
    try {
      const { error } = await supabase.from('profiles').update({ is_active: next }).eq('id', profile.id);
      if (error) throw error;
      toast.success(next ? 'Usuario reactivado.' : 'Usuario desactivado.');
      load();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo cambiar el estado.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-ink-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Panel de administración</h1>
        <p className="mt-0.5 text-sm text-ink-500">Gestiona usuarios, roles y revisa estadísticas globales.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Usuarios" value={profiles.length.toString()} accent="text-sky-600 bg-sky-50" />
        <StatCard icon={BarChart3} label="Total tareas" value={totalTasks.toString()} accent="text-ink-600 bg-ink-100" />
        <StatCard icon={TrendingUp} label="En curso" value={statusCounts.en_curso.toString()} accent="text-indigo-600 bg-indigo-50" />
        <StatCard icon={ShieldCheck} label="Completadas" value={statusCounts.completada.toString()} accent="text-emerald-600 bg-emerald-50" />
      </div>

      {/* Status breakdown */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">Tareas por estado</h2>
        <div className="space-y-3">
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => {
            const pct = totalTasks > 0 ? Math.round((statusCounts[s] / totalTasks) * 100) : 0;
            const colors: Record<TaskStatus, string> = {
              pendiente: 'bg-ink-400',
              en_curso: 'bg-sky-500',
              completada: 'bg-emerald-500',
            };
            return (
              <div key={s}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={s} />
                  </div>
                  <span className="font-medium text-ink-600">{statusCounts[s]} ({pct}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <div className={`h-full rounded-full transition-all duration-500 ${colors[s]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Most active users */}
      {userStats.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700">
            <TrendingUp className="h-4 w-4" /> Usuarios más activos
          </h2>
          <div className="space-y-2">
            {[...userStats].sort((a, b) => b.task_count - a.task_count).slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">{i + 1}</span>
                <span className="flex-1 truncate text-sm text-ink-800">{s.email}</span>
                <span className="text-sm font-semibold text-ink-600">{s.task_count} tareas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-700">Usuarios registrados</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              className="input py-2 pl-9 text-sm"
              placeholder="Buscar usuario…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:bg-ink-100">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                <th className="px-5 py-2.5">Usuario</th>
                <th className="px-3 py-2.5">Rol</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Tareas</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Registro</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filteredProfiles.map((p) => {
                const stat = getStats(p.id);
                const isSelf = p.id === user?.id;
                const isActiveLoading = actionLoading === p.id;
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-ink-50/60 ${!p.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink-900">{p.email}</div>
                      {p.full_name && <div className="text-xs text-ink-400">{p.full_name}</div>}
                      {!p.is_active && <span className="mt-0.5 inline-block text-xs font-medium text-red-600">Desactivado</span>}
                    </td>
                    <td className="px-3 py-3">
                      {p.role === 'admin' ? (
                        <span className="badge bg-sky-50 text-sky-700"><ShieldCheck className="h-3 w-3" /> Admin</span>
                      ) : (
                        <span className="badge bg-ink-100 text-ink-600"><Shield className="h-3 w-3" /> Usuario</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-ink-600 sm:table-cell">{stat?.task_count ?? 0}</td>
                    <td className="hidden px-3 py-3 text-ink-500 md:table-cell">
                      {new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isSelf ? (
                          <span className="text-xs text-ink-400">Tú</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRoleChange(p, p.role === 'admin' ? 'user' : 'admin')}
                              disabled={isActiveLoading}
                              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
                            >
                              {isActiveLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldX className="h-3 w-3" />}
                              {p.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                            </button>
                            <button
                              onClick={() => handleToggleActive(p)}
                              disabled={isActiveLoading}
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                                p.is_active
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="h-3 w-3" />
                              {p.is_active ? 'Desactivar' : 'Reactivar'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-ink-500">No se encontraron usuarios.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-ink-900">{value}</div>
        <div className="text-xs font-medium text-ink-500">{label}</div>
      </div>
    </div>
  );
}
