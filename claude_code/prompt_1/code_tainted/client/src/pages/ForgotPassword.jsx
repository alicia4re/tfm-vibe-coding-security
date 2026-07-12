import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo procesar la solicitud.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Recuperar contrasena</h1>
        <p className="auth-subtitle">Te enviaremos un enlace para restablecerla.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {devResetUrl && (
          <div className="alert alert-info">
            Modo desarrollo (no hay SMTP configurado): <br />
            <a href={devResetUrl}>{devResetUrl}</a>
          </div>
        )}

        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar enlace de recuperacion'}
        </button>

        <p className="auth-switch">
          <Link to="/login">Volver a iniciar sesion</Link>
        </p>
      </form>
    </div>
  );
}
