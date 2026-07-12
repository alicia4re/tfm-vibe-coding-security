import { PRIORITY_LABELS, STATUS_LABELS, formatBytes, formatDate } from '../utils/format';

export default function TaskCard({ task, showOwner, onEdit, onDelete }) {
  return (
    <article className={`task-card priority-${task.priority}`}>
      <div className="task-card-header">
        <h3>{task.title}</h3>
        <span className={`status-pill status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className={`priority-pill priority-${task.priority}`}>Prioridad: {PRIORITY_LABELS[task.priority]}</span>
        <span>Creada: {formatDate(task.createdAt)}</span>
        <span>Limite: {formatDate(task.dueDate)}</span>
        {showOwner && <span>Propietario: {task.ownerEmail}</span>}
      </div>

      {task.attachment && (
        <a className="task-attachment" href={task.attachment.url} target="_blank" rel="noreferrer">
          Adjunto: {task.attachment.originalName} ({formatBytes(task.attachment.size)})
        </a>
      )}

      <div className="task-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>
          Editar
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(task)}>
          Eliminar
        </button>
      </div>
    </article>
  );
}
