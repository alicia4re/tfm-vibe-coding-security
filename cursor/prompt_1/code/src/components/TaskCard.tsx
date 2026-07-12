"use client";

import { Pencil, Trash2, Paperclip, Calendar, User } from "lucide-react";
import {
  priorityLabels,
  statusLabels,
  priorityColors,
  statusColors,
  formatDate,
} from "@/lib/labels";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    dueDate: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    user: { id: string; email: string; name: string | null };
    attachment: { filename: string; filepath: string } | null;
  };
  isAdmin?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, isAdmin, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 line-clamp-2">{task.title}</h3>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mb-3 text-sm text-slate-500 line-clamp-3">{task.description}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      <div className="mt-auto space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Creada: {formatDate(task.createdAt)}</span>
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Límite: {formatDate(task.dueDate)}</span>
          </div>
        )}
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{task.user.name || task.user.email}</span>
          </div>
        )}
        {task.attachment && (
          <a
            href={`/${task.attachment.filepath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-indigo-600 hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachment.filename}
          </a>
        )}
      </div>
    </div>
  );
}
