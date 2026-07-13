"use client";

import { useState } from "react";
import type { Task, Priority, Status } from "@/lib/types";
import { useToast } from "./Toast";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"];

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function TaskModal({
  task,
  onClose,
  onSaved,
}: {
  task: Task | null;
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const { showError, showSuccess } = useToast();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate ?? null));
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<Status>(task?.status ?? "PENDING");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      showError("Solo se permiten imágenes o archivos PDF");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_ATTACHMENT_SIZE) {
      showError("El archivo supera el tamaño máximo de 5 MB");
      e.target.value = "";
      return;
    }
    setFile(f);
    setRemoveAttachment(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        dueDate: dueDate || null,
        priority,
        status,
      };

      const res = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "No se ha podido guardar la tarea");
        setSubmitting(false);
        return;
      }

      let savedTask: Task = data.task;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`/api/tasks/${savedTask.id}/attachment`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          showError(uploadData.error ?? "No se ha podido subir el archivo adjunto");
        } else {
          savedTask = uploadData.task;
        }
      } else if (removeAttachment && task?.attachmentPath) {
        const delRes = await fetch(`/api/tasks/${savedTask.id}/attachment`, {
          method: "DELETE",
        });
        const delData = await delRes.json();
        if (delRes.ok) savedTask = delData.task;
      }

      showSuccess(task ? "Tarea actualizada correctamente" : "Tarea creada correctamente");
      onSaved(savedTask);
    } catch {
      showError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {task ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Título de la tarea"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Detalles de la tarea (opcional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="DONE">Completada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Archivo adjunto (imagen o PDF, máx. 5 MB)
            </label>
            {task?.attachmentName && !file && !removeAttachment && (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <a
                  href={`/api/tasks/${task.id}/attachment`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-indigo-600 hover:underline"
                >
                  {task.attachmentName}
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveAttachment(true)}
                  className="ml-2 shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            )}
            {removeAttachment && (
              <p className="mb-2 text-xs text-amber-700">
                El archivo adjunto se eliminará al guardar.
              </p>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
