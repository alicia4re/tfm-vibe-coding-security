import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la lista de usuarios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (targetUser, role) => {
    try {
      await api.patch(`/admin/users/${targetUser.id}/role`, { role });
      toast.success(`Rol de ${targetUser.email} actualizado a ${role === 'admin' ? 'administrador' : 'usuario'}.`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo actualizar el rol.'));
    }
  };

  const handleToggleActive = async (targetUser) => {
    const nextActive = !targetUser.active;
    if (!window.confirm(`${nextActive ? 'Reactivar' : 'Desactivar'} la cuenta de ${targetUser.email}?`)) return;
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, { active: nextActive });
      toast.success(`Usuario ${targetUser.email} ${nextActive ? 'reactivado' : 'desactivado'} correctamente.`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo actualizar el estado del usuario.'));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Usuarios registrados</h1>
          <p className="page-subtitle">Gestiona roles y disponibilidad de las cuentas.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Cargando usuarios...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Tareas</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.active ? 'row-inactive' : ''}>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      disabled={u.id === currentUser.id}
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                      {u.active ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td>{u.taskCount}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => handleToggleActive(u)}
                      disabled={u.id === currentUser.id}
                    >
                      {u.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
