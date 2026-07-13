"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { StatTile, BarList } from "@/components/Stats";
import { useUser } from "@/lib/useUser";
import type { AdminUser, AdminStats } from "@/lib/adminTypes";

const STATUS_ROWS = [
  { key: "PENDING", label: "Pendiente", color: "#94a3b8" },
  { key: "IN_PROGRESS", label: "En curso", color: "#3b82f6" },
  { key: "DONE", label: "Completada", color: "#10b981" },
];

const PRIORITY_ROWS = [
  { key: "LOW", label: "Baja", color: "#a5b4fc" },
  { key: "MEDIUM", label: "Media", color: "#6366f1" },
  { key: "HIGH", label: "Alta", color: "#4338ca" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminPage() {
  const { showError, showSuccess } = useToast();
  const { user: currentUser } = useUser();
  const [tab, setTab] = useState<"users" | "stats">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) {
      showError(data.error ?? "No se han podido cargar los usuarios");
      return;
    }
    setUsers(data.users);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    if (!res.ok) {
      showError(data.error ?? "No se han podido cargar las estadísticas");
      return;
    }
    setStats(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([loadUsers(), loadStats()]).finally(() => setLoading(false));
  }, [loadUsers, loadStats]);

  async function updateUser(id: string, patch: { role?: string; active?: boolean }) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "No se ha podido actualizar el usuario");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
      showSuccess("Usuario actualizado correctamente");
    } catch {
      showError("Error de conexión al actualizar el usuario");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de administrador</h1>
        <p className="text-sm text-slate-500">Gestiona usuarios y consulta estadísticas del sistema</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "users"
              ? "border-b-2 border-indigo-600 text-indigo-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab("stats")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "stats"
              ? "border-b-2 border-indigo-600 text-indigo-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Estadísticas
        </button>
      </div>

      {tab === "users" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Tareas</th>
                  <th className="px-4 py-3">Registrado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => updateUser(u.id, { role: e.target.value })}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <option value="USER">Usuario</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {u.active ? "Activo" : "Desactivado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u._count.tasks}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={isSelf}
                          onClick={() => updateUser(u.id, { active: !u.active })}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                            u.active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {u.active ? "Desactivar" : "Reactivar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "stats" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Usuarios totales" value={stats.totalUsers} />
            <StatTile label="Usuarios activos" value={stats.activeUsers} />
            <StatTile label="Tareas totales" value={stats.totalTasks} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarList
              title="Tareas por estado"
              rows={STATUS_ROWS.map((r) => ({
                label: r.label,
                value: stats.statusCounts[r.key] ?? 0,
                color: r.color,
              }))}
            />
            <BarList
              title="Tareas por prioridad"
              rows={PRIORITY_ROWS.map((r) => ({
                label: r.label,
                value: stats.priorityCounts[r.key] ?? 0,
                color: r.color,
              }))}
            />
          </div>
          <BarList
            title="Usuarios más activos (por número de tareas)"
            rows={
              stats.mostActiveUsers.length > 0
                ? stats.mostActiveUsers.map((u) => ({
                    label: u.name,
                    value: u.taskCount,
                    color: "#4f46e5",
                  }))
                : [{ label: "Sin datos todavía", value: 0, color: "#cbd5e1" }]
            }
          />
        </div>
      )}
    </div>
  );
}
