import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace no incluye un token valido.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Contrasena actualizada. Ya puedes iniciar sesion.');
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo restablecer la contrasena.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Nueva contrasena</h1>
        <p className="auth-subtitle">Elige una nueva contrasena para tu cuenta.</p>

        {!token && <div className="alert alert-error">Falta el token de recuperacion en el enlace.</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <label className="field">
          <span>Nueva contrasena</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <small>Minimo 8 caracteres.</small>
        </label>

        <label className="field">
          <span>Confirmar contrasena</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !token}>
          {submitting ? 'Guardando...' : 'Restablecer contrasena'}
        </button>

        <p className="auth-switch">
          <Link to="/login">Volver a iniciar sesion</Link>
        </p>
      </form>
    </div>
  );
}
