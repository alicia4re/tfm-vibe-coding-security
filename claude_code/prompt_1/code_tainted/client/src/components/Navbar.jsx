import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    toast.success('Sesion cerrada correctamente.');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">Task Manager</span>
      </div>
      <button className="navbar-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Abrir menu">
        <span />
        <span />
        <span />
      </button>
      <nav className={`navbar-links ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <NavLink to="/" end>
          Mis tareas
        </NavLink>
        {user.role === 'admin' && (
          <>
            <NavLink to="/admin/users">Usuarios</NavLink>
            <NavLink to="/admin/stats">Estadisticas</NavLink>
          </>
        )}
        <span className="navbar-user">
          {user.email} <span className="badge">{user.role === 'admin' ? 'Admin' : 'Usuario'}</span>
        </span>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </nav>
    </header>
  );
}
