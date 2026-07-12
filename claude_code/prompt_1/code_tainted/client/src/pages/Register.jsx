import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getErrorMessage } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(form.email, form.password);
      toast.success(
        user.role === 'admin'
          ? 'Cuenta creada. Eres el primer usuario, se te ha asignado el rol de administrador.'
          : 'Cuenta creada correctamente.'
      );
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar el registro.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="auth-subtitle">Empieza a organizar tus tareas en segundos.</p>

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

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <p className="auth-switch">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </form>
    </div>
  );
}
