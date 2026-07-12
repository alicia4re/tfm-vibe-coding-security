import { useState } from 'react';
import { getErrorMessage } from '../api/client';

const emptyForm = { title: '', description: '', dueDate: '', priority: 'media', status: 'pendiente' };

export default function TaskFormModal({ task, onClose, onSubmit }) {
  const [form, setForm] = useState(
    task
      ? {
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          priority: task.priority,
          status: task.status,
        }
      : emptyForm
  );
  const [file, setFile] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.size > 5 * 1024 * 1024) {
      setError('El archivo supera el tamano maximo permitido (5 MB).');
      e.target.value = '';
      setFile(null);
      return;
    }
    setError('');
    setFile(selected || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      if (form.dueDate) data.append('dueDate', form.dueDate);
      data.append('priority', form.priority);
      data.append('status', form.status);
      if (file) data.append('attachment', file);
      if (removeAttachment) data.append('removeAttachment', 'true');

      await onSubmit(data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la tarea.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{task ? 'Editar tarea' : 'Nueva tarea'}</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <label className="field">
          <span>Titulo *</span>
          <input
            type="text"
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Descripcion</span>
          <textarea
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Fecha limite</span>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </label>

          <label className="field">
            <span>Prioridad</span>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>

          <label className="field">
            <span>Estado</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completada</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Archivo adjunto (imagen o PDF, max. 5 MB)</span>
          <input type="file" accept="image/jpeg,image/png,image/gif,application/pdf" onChange={handleFileChange} />
        </label>

        {task?.attachment && !file && (
          <label className="checkbox-field">
            <input type="checkbox" checked={removeAttachment} onChange={(e) => setRemoveAttachment(e.target.checked)} />
            <span>Eliminar archivo adjunto actual ({task.attachment.originalName})</span>
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar tarea'}
          </button>
        </div>
      </form>
    </div>
  );
}
