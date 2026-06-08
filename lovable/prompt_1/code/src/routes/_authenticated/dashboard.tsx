import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDialog, type TaskRow } from "@/components/TaskDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Paperclip, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const priorityLabel = { low: "Baja", medium: "Media", high: "Alta" } as const;
const statusLabel = { pending: "Pendiente", in_progress: "En curso", completed: "Completada" } as const;

const priorityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning-foreground border border-warning/30",
  high: "bg-destructive/15 text-destructive border border-destructive/30",
};
const statusStyles = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary border border-primary/30",
  completed: "bg-success/15 text-success border border-success/30",
};

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskRow | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskRow[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (!t.title.toLowerCase().includes(s) && !(t.description ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [tasks, search, status, priority]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks", user?.id] });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.attachment_path) {
      await supabase.storage.from("task-attachments").remove([deleteTarget.attachment_path]);
    }
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message);
    else { toast.success("Tarea eliminada"); refresh(); }
    setDeleteTarget(null);
  };

  const openAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from("task-attachments").createSignedUrl(path, 60);
    if (error) return toast.error("No se pudo abrir el archivo");
    window.open(data.signedUrl, "_blank");
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis tareas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu trabajo y mantén el foco.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva tarea
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, cls: "bg-card" },
          { label: "Pendientes", value: stats.pending, cls: "bg-muted/50" },
          { label: "En curso", value: stats.in_progress, cls: "bg-primary/10" },
          { label: "Completadas", value: stats.completed, cls: "bg-success/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o descripción..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En curso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Prioridad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">
            {tasks.length === 0 ? "Aún no tienes tareas. ¡Crea la primera!" : "No se encontraron tareas con esos filtros."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <div key={t.id} className="group rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{t.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[t.priority]}`}>{priorityLabel[t.priority]}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[t.status]}`}>{statusLabel[t.status]}</span>
                  </div>
                  {t.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {t.due_date && (
                      <span className="flex items-center gap-1">
                        <CalIcon className="h-3.5 w-3.5" />
                        {format(new Date(t.due_date), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    )}
                    {t.attachment_name && (
                      <button onClick={() => openAttachment(t.attachment_path!)} className="flex items-center gap-1 text-primary hover:underline">
                        <Paperclip className="h-3.5 w-3.5" /> {t.attachment_name}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} onSaved={refresh} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
