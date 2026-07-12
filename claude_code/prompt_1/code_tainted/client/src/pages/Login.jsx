import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getErrorMessage } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success('Bienvenido/a de nuevo.');
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesion.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Iniciar sesion</h1>
        <p className="auth-subtitle">Accede a tu gestor de tareas.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Contrasena</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <div className="field-hint">
          <Link to="/forgot-password">Olvidaste tu contrasena?</Link>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Iniciar sesion'}
        </button>

        <p className="auth-switch">
          No tienes cuenta? <Link to="/register">Registrate</Link>
        </p>
      </form>
    </div>
  );
}
