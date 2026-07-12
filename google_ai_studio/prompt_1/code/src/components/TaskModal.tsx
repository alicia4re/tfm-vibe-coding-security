import React, { useState, useEffect } from "react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { X, Upload, FileText, Trash2, AlertTriangle } from "lucide-react";

interface TaskModalProps {
  task: Task | null; // Null means creating, non-null means editing
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function TaskModal({ task, isOpen, onClose, onSubmit }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("baja");
  const [status, setStatus] = useState<TaskStatus>("pendiente");
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      // Editing Mode
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
      setPriority(task.priority);
      setStatus(task.status);
      setFile(null);
      setRemoveExistingFile(false);
    } else {
      // Creating Mode
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("baja");
      setStatus("pendiente");
      setFile(null);
      setRemoveExistingFile(false);
    }
    setError("");
    setFileError("");
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setFileError("El archivo supera el límite de 5 MB.");
      setFile(null);
      e.target.value = ""; // Clear file input
      return;
    }

    // Validate type (images and pdf)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError("Formato no soportado. Solo se admiten PDFs e imágenes (JPEG, PNG, GIF).");
      setFile(null);
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setRemoveExistingFile(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título de la tarea es obligatorio.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("dueDate", dueDate);
      formData.append("priority", priority);
      formData.append("status", status);

      if (file) {
        formData.append("file", file);
      }

      if (task) {
        // If we want to delete file or replaced it
        if (removeExistingFile || file) {
          formData.append("removeFile", "true");
        }
      }

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la tarea.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Redactar informe financiero"
              maxLength={80}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre los requisitos, objetivos o recursos de la tarea..."
              rows={3}
              maxLength={1000}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Dual row: Due Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Fecha Límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-gray-700"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-gray-700 capitalize"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Status (Normally visible when editing, or set initially) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Estado de la Tarea
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-gray-700 capitalize"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en curso">En Curso</option>
              <option value="completada">Completada</option>
            </select>
          </div>

          {/* File Attachment Upload */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Adjuntar Archivo (PDF o Imagen, Máx. 5 MB)
            </label>
            
            {/* Show existing file if editing and not removed */}
            {task?.fileUrl && !removeExistingFile && (
              <div className="mb-3 p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-700">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">{task.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRemoveExistingFile(true);
                    setFile(null);
                  }}
                  className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="Eliminar adjunto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar
                </button>
              </div>
            )}

            {/* Upload Area */}
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center">
              <input
                type="file"
                accept="image/jpeg, image/png, image/gif, application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title=""
              />
              <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
              <p className="text-xs text-gray-600 font-medium">
                {file ? (
                  <span className="text-indigo-600 font-semibold">{file.name}</span>
                ) : (
                  <span>Haz clic o arrastra para adjuntar un archivo</span>
                )}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Formatos: PDF, JPG, PNG, GIF</p>
            </div>

            {fileError && (
              <p className="text-rose-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {fileError}
              </p>
            )}
            
            {removeExistingFile && !file && (
              <p className="text-amber-600 text-[11px] font-medium mt-1">
                El archivo adjunto actual se eliminará al guardar.
              </p>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-hidden disabled:opacity-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow-md focus:outline-hidden disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <span>{task ? "Guardar Cambios" : "Crear Tarea"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
