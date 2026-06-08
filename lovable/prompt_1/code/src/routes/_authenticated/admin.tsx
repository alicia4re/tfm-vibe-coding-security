import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, ClipboardList, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPanel });

type UserRow = { id: string; email: string; display_name: string | null; active: boolean; created_at: string };
type RoleRow = { user_id: string; role: "admin" | "user" };
type TaskAgg = { user_id: string; status: string };

function AdminPanel() {
  const { role, user } = useAuth();
  const qc = useQueryClient();

  if (role && role !== "admin") return <Navigate to="/dashboard" replace />;

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRow[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id,role");
      if (error) throw error;
      return data as RoleRow[];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("user_id,status");
      if (error) throw error;
      return data as TaskAgg[];
    },
  });

  const userRole = useMemo(() => {
    const m = new Map<string, "admin" | "user">();
    roles.forEach((r) => m.set(r.user_id, r.role));
    return m;
  }, [roles]);

  const stats = useMemo(() => {
    const byStatus = { pending: 0, in_progress: 0, completed: 0 };
    const byUser = new Map<string, number>();
    tasks.forEach((t) => {
      byStatus[t.status as keyof typeof byStatus]++;
      byUser.set(t.user_id, (byUser.get(t.user_id) ?? 0) + 1);
    });
    const top = Array.from(byUser.entries())
      .map(([uid, count]) => ({ uid, count, user: users.find((u) => u.id === uid) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { byStatus, total: tasks.length, top };
  }, [tasks, users]);

  const setRole = async (uid: string, newRole: "admin" | "user") => {
    if (uid === user?.id && newRole !== "admin") return toast.error("No puedes quitarte tu propio rol de administrador");
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Rol actualizado");
    qc.invalidateQueries({ queryKey: ["admin-roles"] });
  };

  const toggleActive = async (u: UserRow) => {
    if (u.id === user?.id) return toast.error("No puedes desactivar tu propia cuenta");
    const { error } = await supabase.from("profiles").update({ active: !u.active }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.active ? "Usuario desactivado" : "Usuario reactivado");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">Gestiona usuarios, roles y supervisa la actividad.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Usuarios" value={users.length} />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Tareas totales" value={stats.total} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="En curso" value={stats.byStatus.in_progress} accent />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Completadas" value={stats.byStatus.completed} success />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => {
                    const r = userRole.get(u.id) ?? "user";
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{u.display_name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <Select value={r} onValueChange={(v) => setRole(u.id, v as "admin" | "user")}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.active ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
                            {u.active ? "Activo" : "Desactivado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => toggleActive(u)}>
                            {u.active ? "Desactivar" : "Reactivar"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Tareas por estado</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatusBar label="Pendientes" value={stats.byStatus.pending} total={stats.total} color="bg-muted-foreground/50" />
              <StatusBar label="En curso" value={stats.byStatus.in_progress} total={stats.total} color="bg-primary" />
              <StatusBar label="Completadas" value={stats.byStatus.completed} total={stats.total} color="bg-success" />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Usuarios más activos</h3>
            {stats.top.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {stats.top.map((t, i) => (
                  <li key={t.uid} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                      <span className="font-medium">{t.user?.display_name ?? t.user?.email ?? "Desconocido"}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{t.count} tarea{t.count === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, accent, success }: { icon: React.ReactNode; label: string; value: number; accent?: boolean; success?: boolean }) {
  const cls = success ? "bg-success/10 text-success" : accent ? "bg-primary/10 text-primary" : "bg-muted text-foreground";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cls}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} ({pct}%)</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
