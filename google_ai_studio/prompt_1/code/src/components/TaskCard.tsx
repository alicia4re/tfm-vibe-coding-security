import React, { useState } from "react";
import { Task, User, TaskStatus, TaskPriority } from "../types";
import { Calendar, FileText, Edit, Trash2, Eye, Download, User as UserIcon, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  currentUser: User;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void | Promise<void>;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void | Promise<void>;
}

export default function TaskCard({ task, currentUser, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  const canManage = currentUser.role === "admin" || task.userId === currentUser.id;

  // Helper to format ISO date to readable string
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Sin fecha límite";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
      case "alta":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10";
      case "media":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10";
      case "baja":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10";
      default:
        return "bg-gray-50 text-gray-700 ring-1 ring-gray-600/10";
    }
  };

  const getStatusStyles = (status: TaskStatus) => {
    switch (status) {
      case "completada":
        return {
          bg: "bg-green-50/50",
          border: "border-green-100",
          badge: "bg-green-100 text-green-800",
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />
        };
      case "en curso":
        return {
          bg: "bg-indigo-50/30",
          border: "border-indigo-100",
          badge: "bg-indigo-100 text-indigo-800",
          icon: <Clock className="w-5 h-5 text-indigo-600" />
        };
      case "pendiente":
      default:
        return {
          bg: "bg-white",
          border: "border-gray-200",
          badge: "bg-gray-100 text-gray-800",
          icon: <AlertCircle className="w-5 h-5 text-gray-500" />
        };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const isImage = (fileName?: string) => {
    if (!fileName) return false;
    const lower = fileName.toLowerCase();
    return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp");
  };

  const statusConfig = getStatusStyles(task.status);

  return (
    <div
      id={`task-card-${task.id}`}
      className={`relative p-5 rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${statusConfig.bg} ${statusConfig.border}`}
    >
      {/* Upper Section */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${getPriorityStyles(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${statusConfig.badge}`}>
              {task.status}
            </span>
          </div>

          {canManage && (
            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100">
              <button
                id={`btn-edit-task-${task.id}`}
                onClick={() => onEdit(task)}
                className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar tarea"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                id={`btn-delete-task-${task.id}`}
                onClick={() => {
                  if (window.confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
                    onDelete(task.id);
                  }
                }}
                className="p-1 text-gray-500 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Eliminar tarea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <h3 className={`text-base font-semibold text-gray-900 tracking-tight mb-1.5 ${task.status === "completada" ? "line-through text-gray-500" : ""}`}>
          {task.title}
        </h3>

        <p className={`text-sm text-gray-600 mb-4 whitespace-pre-line leading-relaxed ${task.status === "completada" ? "text-gray-400" : ""}`}>
          {task.description || <span className="text-gray-400 italic">Sin descripción</span>}
        </p>
      </div>

      {/* Attachment and Metadata */}
      <div className="mt-auto space-y-3.5">
        {/* File Attachment Area */}
        {task.fileUrl && (
          <div className="p-2.5 rounded-lg border border-gray-100 bg-white/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-gray-700 truncate" title={task.fileName}>
                  {task.fileName}
                </p>
                {task.fileSize && <p className="text-[10px] text-gray-400">{formatFileSize(task.fileSize)}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {isImage(task.fileName) && (
                <button
                  onClick={() => setShowImageModal(true)}
                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Ver imagen"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              <a
                href={task.fileUrl}
                download={task.fileName || "adjunto"}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors flex items-center"
                title="Descargar archivo"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Date / Owner Section */}
        <div className="pt-3 border-t border-gray-100/80 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className={new Date(task.dueDate).getTime() < Date.now() && task.status !== "completada" ? "text-rose-600 font-semibold" : ""}>
              Lim: {formatDate(task.dueDate)}
            </span>
          </div>

          {currentUser.role === "admin" ? (
            <div className="flex items-center gap-1 text-gray-400 truncate max-w-[150px]" title={`Propietario: ${task.userEmail}`}>
              <UserIcon className="w-3 h-3 shrink-0" />
              <span className="truncate text-[10px] font-medium">{task.userEmail}</span>
            </div>
          ) : (
            <div className="text-[10px] text-gray-400">
              Creado: {formatDate(task.createdAt)}
            </div>
          )}
        </div>

        {/* Status quick changer */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Estado:</span>
          <div className="flex gap-1 shrink-0">
            {(["pendiente", "en curso", "completada"] as TaskStatus[]).map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => onStatusChange(task.id, statusOption)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize transition-all duration-150 ${
                  task.status === statusOption
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Image Modal */}
      {showImageModal && task.fileUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h4 className="font-semibold text-gray-800 truncate pr-4">{task.fileName}</h4>
              <button
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-900 max-h-[70vh]">
              <img
                src={task.fileUrl}
                alt={task.fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <a
                href={task.fileUrl}
                download={task.fileName || "adjunto"}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
