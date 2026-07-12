"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useSession } from "next-auth/react";
import { Alert } from "./Alert";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { priorityLabels, statusLabels } from "@/lib/labels";

interface Task {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  user: { id: string; email: string; name: string | null };
  attachment: {
    id: string;
    filename: string;
    filepath: string;
    mimetype: string;
    size: number;
  } | null;
}

export function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

    try {
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch {
      setAlert({ type: "error", message: "Error al cargar tareas" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAlert({ type: "success", message: "Tarea eliminada" });
      fetchTasks();
    } else {
      const data = await res.json();
      setAlert({ type: "error", message: data.error || "Error al eliminar" });
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditingTask(null);
    setAlert({ type: "success", message: editingTask ? "Tarea actualizada" : "Tarea creada" });
    fetchTasks();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Tareas</h1>
          <p className="text-sm text-slate-500">
            {session?.user?.role === "ADMIN"
              ? "Gestiona todas las tareas del sistema"
              : "Organiza y gestiona tus tareas"}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas las prioridades</option>
              {Object.entries(priorityLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <Filter className="h-4 w-4" />
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-500">No hay tareas que mostrar</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
          >
            Crear tu primera tarea
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isAdmin={session?.user?.role === "ADMIN"}
              onEdit={() => {
                setEditingTask(task);
                setModalOpen(true);
              }}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSave}
          onError={(msg) => setAlert({ type: "error", message: msg })}
        />
      )}
    </div>
  );
}
