const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Inicia sesion de nuevo.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, active FROM users WHERE id = ?').get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado. Inicia sesion de nuevo.' });
    }
    if (!user.active) {
      res.clearCookie('token');
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta con un administrador.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesion invalida o caducada. Inicia sesion de nuevo.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos de administrador para esta accion.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
