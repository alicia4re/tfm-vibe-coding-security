const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e intentalo de nuevo.' },
});

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role, active: !!user.active };
}

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('Introduce un email valido.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contrasena debe tener al menos 8 caracteres.'),
  ],
  handleValidation,
  (req, res) => {
    const { email, password } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const role = userCount === 0 ? 'admin' : 'user';
    const passwordHash = bcrypt.hashSync(password, 12);

    const result = db
      .prepare('INSERT INTO users (email, password_hash, role, active) VALUES (?, ?, ?, 1)')
      .run(email, passwordHash, role);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    setAuthCookie(res, user);
    res.status(201).json({ user: publicUser(user) });
  }
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().withMessage('Introduce un email valido.').normalizeEmail(), body('password').notEmpty()],
  handleValidation,
  (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos.' });
    }
    if (!user.active) {
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta con un administrador.' });
    }

    setAuthCookie(res, user);
    res.json({ user: publicUser(user) });
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Sesion cerrada correctamente.' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('Introduce un email valido.').normalizeEmail()],
  handleValidation,
  async (req, res) => {
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Respuesta identica exista o no la cuenta, para no filtrar que emails estan registrados.
    const genericResponse = {
      message: 'Si el email existe en nuestro sistema, recibiras un enlace de recuperacion en breve.',
    };

    if (!user || !user.active) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
      user.id,
      tokenHash,
      expiresAt
    );

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;

    const result = await sendPasswordResetEmail(user.email, resetUrl);

    if (result.devMode && !isProd) {
      return res.json({ ...genericResponse, devResetUrl: resetUrl });
    }
    res.json(genericResponse);
  }
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Token invalido.'),
    body('password').isLength({ min: 8 }).withMessage('La contrasena debe tener al menos 8 caracteres.'),
  ],
  handleValidation,
  (req, res) => {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRow = db
      .prepare('SELECT * FROM password_resets WHERE token_hash = ? AND used = 0')
      .get(tokenHash);

    if (!resetRow || new Date(resetRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'El enlace de recuperacion no es valido o ha caducado.' });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, resetRow.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);

    res.json({ message: 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.' });
  }
);

module.exports = router;
