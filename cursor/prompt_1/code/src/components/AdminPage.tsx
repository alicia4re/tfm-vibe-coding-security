"use client";

import { useState, useEffect } from "react";
import { Users, BarChart3, Shield, UserCheck, UserX } from "lucide-react";
import { Alert } from "./Alert";
import { statusLabels } from "@/lib/labels";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  active: boolean;
  createdAt: string;
  _count: { tasks: number };
}

interface Stats {
  statusCounts: Record<string, number>;
  activeUsers: { id: string; email: string; name: string | null; _count: { tasks: number } }[];
  totalUsers: number;
  totalTasks: number;
}

export function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      setAlert({ type: "error", message: "Error al cargar datos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateUser = async (id: string, data: { role?: string; active?: boolean }) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setAlert({ type: "success", message: "Usuario actualizado" });
      fetchData();
    } else {
      const err = await res.json();
      setAlert({ type: "error", message: err.error || "Error al actualizar" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-sm text-slate-500">Gestiona usuarios y consulta estadísticas</p>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2.5">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                <p className="text-xs text-slate-500">Usuarios totales</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalTasks}</p>
                <p className="text-xs text-slate-500">Tareas totales</p>
              </div>
            </div>
          </div>
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">
                {statusLabels[status as keyof typeof statusLabels] || status}
              </p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.activeUsers.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Usuarios más activos
          </h2>
          <div className="space-y-2">
            {stats.activeUsers.map((user, i) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {user.name || user.email}
                  </span>
                </div>
                <span className="text-sm text-slate-500">{user._count.tasks} tareas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Shield className="h-5 w-5 text-indigo-600" />
            Usuarios registrados
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Tareas</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{user.name || "—"}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="USER">Usuario</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{user._count.tasks}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => updateUser(user.id, { active: !user.active })}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        user.active
                          ? "text-red-600 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {user.active ? (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Reactivar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
