"use client";

import { useState, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { priorityLabels, statusLabels } from "@/lib/labels";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  attachment: { id: string; filename: string; filepath: string } | null;
}

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
  onError: (msg: string) => void;
}

export function TaskModal({ task, onClose, onSave, onError }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [status, setStatus] = useState(task?.status || "PENDING");
  const [saving, setSaving] = useState(false);
  const [attachment, setAttachment] = useState(task?.attachment || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      title,
      description: description || undefined,
      dueDate: dueDate || null,
      priority,
      status,
    };

    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        onError(data.error || "Error al guardar");
        return;
      }

      const saved = await res.json();

      if (fileRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append("file", fileRef.current.files[0]);
        const uploadRes = await fetch(`/api/tasks/${saved.id}/attachment`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          onError(data.error || "Error al subir archivo");
          return;
        }
      }

      onSave();
    } catch {
      onError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!task?.id || !attachment) return;
    const res = await fetch(`/api/tasks/${task.id}/attachment`, { method: "DELETE" });
    if (res.ok) setAttachment(null);
    else onError("Error al eliminar adjunto");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {task ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Adjunto (imagen o PDF, máx. 5 MB)
            </label>
            {attachment ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <a
                  href={`/${attachment.filepath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  {attachment.filename}
                </a>
                <button
                  type="button"
                  onClick={handleDeleteAttachment}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
                <Upload className="h-5 w-5" />
                Seleccionar archivo
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
