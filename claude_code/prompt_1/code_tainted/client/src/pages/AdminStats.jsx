import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { STATUS_LABELS } from '../utils/format';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(getErrorMessage(err, 'No se pudieron cargar las estadisticas.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page-loading">Cargando estadisticas...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const maxStatusCount = Math.max(1, ...Object.values(stats.statusCounts));
  const maxTaskCount = Math.max(1, ...stats.mostActiveUsers.map((u) => u.taskCount));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Estadisticas</h1>
          <p className="page-subtitle">Vision general de la actividad en la aplicacion.</p>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.totalUsers}</span>
          <span className="stat-tile-label">Usuarios registrados</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.totalTasks}</span>
          <span className="stat-tile-label">Tareas totales</span>
        </div>
      </div>

      <div className="stats-grid">
        <section className="card">
          <h2>Tareas por estado</h2>
          <div className="bar-chart">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div className="bar-row" key={status}>
                <span className="bar-label">{STATUS_LABELS[status]}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill status-${status}`}
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Usuarios mas activos</h2>
          {stats.mostActiveUsers.length === 0 ? (
            <p className="empty-state">Todavia no hay tareas creadas.</p>
          ) : (
            <div className="bar-chart">
              {stats.mostActiveUsers.map((u) => (
                <div className="bar-row" key={u.id}>
                  <span className="bar-label" title={u.email}>
                    {u.email}
                  </span>
                  <div className="bar-track">
                    <div className="bar-fill bar-fill-active" style={{ width: `${(u.taskCount / maxTaskCount) * 100}%` }} />
                  </div>
                  <span className="bar-value">{u.taskCount}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
