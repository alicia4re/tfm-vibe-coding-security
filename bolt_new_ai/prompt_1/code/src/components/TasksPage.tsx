import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Filter, Calendar, Paperclip, Pencil, Trash2,
  Inbox, ChevronDown, X, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchMyTasks, fetchAllTasks } from '../lib/tasks';
import { TaskFormModal } from './TaskFormModal';
import { DeleteTaskModal } from './DeleteTaskModal';
import { PriorityBadge, StatusBadge } from './Badges';
import { Spinner } from './Spinner';
import { PRIORITY_ORDER, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import type { Task, TaskPriority, TaskStatus } from '../types';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | TaskPriority;

export function TasksPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'mine' | 'all'>('mine');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = view === 'all' && isAdmin
        ? await fetchAllTasks()
        : await fetchMyTasks(user.id);
      setTasks(data);
    } catch (err) {
      toast.error((err as Error).message || 'No se pudieron cargar las tareas.');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, view, toast]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => statusFilter === 'all' || t.status === statusFilter)
      .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter)
      .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.status !== b.status) {
          const order: Record<TaskStatus, number> = { pendiente: 0, en_curso: 1, completada: 2 };
          return order[a.status] - order[b.status];
        }
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      });
  }, [tasks, search, statusFilter, priorityFilter]);

  const hasActiveFilters = search || statusFilter !== 'all' || priorityFilter !== 'all';

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (t: Task) => { setEditTarget(t); setFormOpen(true); };

  const counts = useMemo(() => {
    const byStatus: Record<TaskStatus, number> = { pendiente: 0, en_curso: 0, completada: 0 };
    tasks.forEach((t) => { byStatus[t.status]++; });
    return byStatus;
  }, [tasks]);

  const ownerLabel = (t: Task & { profiles?: { email: string; full_name: string | null } | null }) => {
    if (view !== 'all' || !isAdmin) return null;
    const p = t.profiles;
    const name = p?.full_name || p?.email?.split('@')[0] || 'Usuario';
    return (
      <span className="hidden text-xs text-ink-400 sm:inline">
        · {name}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Tareas</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            {view === 'all' && isAdmin ? 'Todas las tareas de la organización.' : 'Tus tareas personales.'}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Nueva tarea
        </button>
      </div>

      {isAdmin && (
        <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 text-sm">
          <button
            onClick={() => setView('mine')}
            className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${view === 'mine' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900'}`}
          >
            Mis tareas
          </button>
          <button
            onClick={() => setView('all')}
            className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${view === 'all' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900'}`}
          >
            Todas
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {(['pendiente', 'en_curso', 'completada'] as TaskStatus[]).map((s) => (
          <div key={s} className="card px-4 py-3">
            <div className="text-2xl font-bold text-ink-900">{counts[s]}</div>
            <div className="mt-0.5 text-xs font-medium text-ink-500">{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="input pl-10"
            placeholder="Buscar por título o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:bg-ink-100">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary ${showFilters || hasActiveFilters ? 'border-sky-400 text-sky-700' : ''}`}
        >
          <Filter className="h-4 w-4" /> Filtros
          {hasActiveFilters && (
            <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
              {[statusFilter !== 'all', priorityFilter !== 'all', !!search].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="card flex flex-col gap-4 p-4 animate-slide-up sm:flex-row">
          <div className="flex-1">
            <label className="label">Estado</label>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Todos</FilterChip>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {STATUS_LABELS[s]}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="label">Prioridad</label>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={priorityFilter === 'all'} onClick={() => setPriorityFilter('all')}>Todas</FilterChip>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <FilterChip key={p} active={priorityFilter === p} onClick={() => setPriorityFilter(p)}>
                  {PRIORITY_LABELS[p]}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7 text-ink-300" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasTasks={tasks.length > 0} onCreate={openCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={() => openEdit(t)}
              onDelete={() => setDeleteTarget(t)}
              extra={ownerLabel(t as never)}
            />
          ))}
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadTasks}
        task={editTarget}
      />
      <DeleteTaskModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={loadTasks}
        task={deleteTarget}
      />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
      }`}
    >
      {children}
    </button>
  );
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  extra,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  extra?: React.ReactNode;
}) {
  const overdue = task.due_date && task.status !== 'completada' && new Date(task.due_date) < new Date(new Date().toDateString());
  return (
    <div className="card group flex flex-col p-4 transition-shadow hover:shadow-soft">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge value={task.priority} />
          <StatusBadge value={task.status} />
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold leading-snug text-ink-900">{task.title}</h3>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-400">
        {task.due_date && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-red-600' : ''}`}>
            <Calendar className="h-3.5 w-3.5" />
            {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            {overdue && <span className="inline-flex items-center gap-0.5"><AlertCircle className="h-3 w-3" />vencida</span>}
          </span>
        )}
        {task.attachment_path && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" /> Adjunto
          </span>
        )}
        {extra}
      </div>
    </div>
  );
}

function EmptyState({ hasTasks, onCreate }: { hasTasks: boolean; onCreate: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100">
        <Inbox className="h-7 w-7 text-ink-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-900">
        {hasTasks ? 'No hay tareas que coincidan' : 'Aún no tienes tareas'}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-ink-500">
        {hasTasks
          ? 'Prueba a ajustar los filtros o la búsqueda para encontrar lo que buscas.'
          : 'Crea tu primera tarea para empezar a organizar tu trabajo.'}
      </p>
      {!hasTasks && (
        <button onClick={onCreate} className="btn-primary mt-5">
          <Plus className="h-4 w-4" /> Crear primera tarea
        </button>
      )}
    </div>
  );
}
