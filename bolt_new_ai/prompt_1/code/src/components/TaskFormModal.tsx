import { useEffect, useState } from 'react';
import { Paperclip, Trash2, Loader2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  createTask,
  updateTask,
  uploadAttachment,
  setAttachmentMeta,
  validateFile,
  getAttachmentUrl,
  removeAttachment,
  type TaskInput,
} from '../lib/tasks';
import type { Task, TaskPriority, TaskStatus } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  task?: Task | null;
}

const empty: TaskInput = { title: '', description: '', priority: 'media', status: 'pendiente', due_date: null };

export function TaskFormModal({ open, onClose, onSaved, task }: Props) {
  const isEdit = !!task;
  const [form, setForm] = useState<TaskInput>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingFile, setRemovingFile] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(task
        ? {
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ?? null,
          }
        : empty);
    }
  }, [open, task]);

  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('El título es obligatorio.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (isEdit && task) {
        await updateTask(task.id, form);
        toast.success('Tarea actualizada.');
      } else {
        await createTask(form, user.id);
        toast.success('Tarea creada.');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo guardar la tarea.');
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !user) return;
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const path = await uploadAttachment(user.id, task.id, file);
      await setAttachmentMeta(task.id, path, file.name);
      toast.success('Archivo adjuntado.');
      onSaved();
    } catch {
      toast.error('No se pudo subir el archivo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleViewFile = async () => {
    if (!task?.attachment_path) return;
    try {
      const url = await getAttachmentUrl(task.attachment_path);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toast.error('No se pudo generar el enlace.');
    } catch {
      toast.error('No se pudo abrir el archivo.');
    }
  };

  const handleRemoveFile = async () => {
    if (!task?.attachment_path || !task?.attachment_name) return;
    setRemovingFile(true);
    try {
      await removeAttachment(task.id, task.attachment_path);
      toast.success('Archivo eliminado.');
      onSaved();
    } catch {
      toast.error('No se pudo eliminar el archivo.');
    } finally {
      setRemovingFile(false);
    }
  };

  const isImage = task?.attachment_name?.match(/\.(png|jpe?g|webp|gif)$/i);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar tarea' : 'Nueva tarea'}
      description={isEdit ? 'Modifica los detalles de tu tarea.' : 'Completa los campos para crear una tarea.'}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label" htmlFor="title">Título</label>
          <input
            id="title"
            className="input"
            placeholder="Ej. Preparar informe trimestral"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="desc">Descripción</label>
          <textarea
            id="desc"
            className="input min-h-[88px] resize-y"
            placeholder="Detalles, contexto o notas…"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="priority">Prioridad</label>
            <select
              id="priority"
              className="input"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as TaskPriority)}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Estado</label>
            <select
              id="status"
              className="input"
              value={form.status}
              onChange={(e) => set('status', e.target.value as TaskStatus)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completada</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="due">Fecha límite</label>
            <input
              id="due"
              type="date"
              className="input"
              value={form.due_date ?? ''}
              onChange={(e) => set('due_date', e.target.value || null)}
            />
          </div>
        </div>

        {/* Attachment */}
        {isEdit && (
          <div>
            <label className="label">Archivo adjunto</label>
            {task?.attachment_path ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  {isImage ? <ImageIcon className="h-5 w-5 shrink-0 text-ink-500" /> : <FileText className="h-5 w-5 shrink-0 text-ink-500" />}
                  <button onClick={handleViewFile} className="flex min-w-0 items-center gap-1 text-sm font-medium text-sky-600 hover:underline">
                    <span className="truncate">{task.attachment_name}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={removingFile}
                  className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  {removingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-white px-4 py-3 text-sm text-ink-500 transition-colors hover:border-sky-400 hover:text-sky-600">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                {uploading ? 'Subiendo…' : 'Adjuntar imagen o PDF (máx. 5 MB)'}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
              </label>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
