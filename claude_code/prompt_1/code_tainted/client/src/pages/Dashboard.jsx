import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.priority) params.priority = activeFilters.priority;
      if (activeFilters.search) params.search = activeFilters.search;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las tareas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchTasks(filters), filters.search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [filters, fetchTasks]);

  const openNewTaskForm = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const openEditTaskForm = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Tarea actualizada correctamente.');
    } else {
      await api.post('/tasks', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Tarea creada correctamente.');
    }
    setShowForm(false);
    fetchTasks(filters);
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Eliminar la tarea "${task.title}"? Esta accion no se puede deshacer.`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Tarea eliminada correctamente.');
      fetchTasks(filters);
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo eliminar la tarea.'));
    }
  };

  const emptyMessage = useMemo(() => {
    if (filters.status || filters.priority || filters.search) {
      return 'No hay tareas que coincidan con los filtros seleccionados.';
    }
    return 'Todavia no tienes tareas. Crea la primera con el boton "Nueva tarea".';
  }, [filters]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{user.role === 'admin' ? 'Todas las tareas' : 'Mis tareas'}</h1>
          <p className="page-subtitle">
            {user.role === 'admin'
              ? 'Como administrador puedes ver y gestionar las tareas de todos los usuarios.'
              : 'Gestiona tus tareas pendientes, en curso y completadas.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewTaskForm}>
          + Nueva tarea
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="Buscar por titulo o descripcion..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="search-input"
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_curso">En curso</option>
          <option value="completada">Completada</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">Todas las prioridades</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Cargando tareas...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showOwner={user.role === 'admin'}
              onEdit={openEditTaskForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal task={editingTask} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
