"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import TaskModal from "@/components/TaskModal";
import { PriorityBadge, StatusBadge } from "@/components/Badge";
import { useUser } from "@/lib/useUser";
import type { Task, Priority, Status } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return "Sin fecha límite";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { showError, showSuccess } = useToast();
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [q, setQ] = useState("");
  const [scopeAll, setScopeAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (q.trim()) params.set("q", q.trim());
      if (scopeAll) params.set("scope", "all");
      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "No se han podido cargar las tareas");
        return;
      }
      setTasks(data.tasks);
    } catch {
      showError("Error de conexión al cargar las tareas");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, scopeAll]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const timeout = setTimeout(() => loadTasks(), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openCreate() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function handleSaved(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "No se ha podido eliminar la tarea");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showSuccess("Tarea eliminada");
    } catch {
      showError("Error de conexión al eliminar la tarea");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {scopeAll ? "Tareas de todos los usuarios" : "Mis tareas"}
          </h1>
          <p className="text-sm text-slate-500">Gestiona tus tareas pendientes, en curso y completadas</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Nueva tarea
        </button>
      </div>

      {user?.role === "ADMIN" && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={scopeAll}
              onChange={(e) => setScopeAll(e.target.checked)}
              className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
            />
            Ver las tareas de todos los usuarios (vista de administrador)
          </label>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título o descripción..."
          className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status | "")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En curso</option>
          <option value="DONE">Completada</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority | "")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Todas las prioridades</option>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-500">No hay tareas que coincidan con los filtros.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-900">{task.title}</h3>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {scopeAll && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {task.owner.name}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Límite: {formatDate(task.dueDate)}</span>
                    <span>Creada: {formatDate(task.createdAt)}</span>
                    {task.attachmentName && (
                      <a
                        href={`/api/tasks/${task.id}/attachment`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                      >
                        📎 {task.attachmentName}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(task)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  {confirmDeleteId === task.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(task.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <TaskModal task={editingTask} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
