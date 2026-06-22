import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { deleteTask } from '../lib/tasks';
import type { Task } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  task: Task | null;
}

export function DeleteTaskModal({ open, onClose, onDeleted, task }: Props) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const handleDelete = async () => {
    if (!task) return;
    const ownerId = task.user_id || user?.id;
    if (!ownerId) return;
    setLoading(true);
    try {
      await deleteTask(task.id, ownerId);
      toast.success('Tarea eliminada.');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo eliminar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Eliminar tarea" size="sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-ink-700">
            ¿Seguro que quieres eliminar <span className="font-semibold text-ink-900">"{task?.title}"</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleDelete} disabled={loading} className="btn-danger">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {loading ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
