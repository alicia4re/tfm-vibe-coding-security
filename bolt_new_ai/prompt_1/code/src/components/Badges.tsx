import type { TaskPriority, TaskStatus } from '../types';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  baja: 'bg-ink-100 text-ink-600',
  media: 'bg-amber-50 text-amber-700',
  alta: 'bg-red-50 text-red-700',
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  pendiente: 'bg-ink-100 text-ink-600',
  en_curso: 'bg-sky-50 text-sky-700',
  completada: 'bg-emerald-50 text-emerald-700',
};

export function PriorityBadge({ value }: { value: TaskPriority }) {
  const labels = { baja: 'Baja', media: 'Media', alta: 'Alta' };
  return <span className={`badge ${PRIORITY_STYLES[value]}`}>{labels[value]}</span>;
}

export function StatusBadge({ value }: { value: TaskStatus }) {
  const labels = { pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada' };
  return <span className={`badge ${STATUS_STYLES[value]}`}>{labels[value]}</span>;
}
