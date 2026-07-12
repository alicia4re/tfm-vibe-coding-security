const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

router.use(requireAuth, requireAdmin);

router.get('/users', (req, res) => {
  const users = db
    .prepare(
      `SELECT users.id, users.email, users.role, users.active, users.created_at,
              COUNT(tasks.id) AS task_count
       FROM users
       LEFT JOIN tasks ON tasks.owner_id = users.id
       GROUP BY users.id
       ORDER BY users.created_at ASC`
    )
    .all();

  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      active: !!u.active,
      createdAt: u.created_at,
      taskCount: u.task_count,
    })),
  });
});

router.patch(
  '/users/:id/role',
  [param('id').isInt(), body('role').isIn(['admin', 'user']).withMessage('Rol invalido.')],
  handleValidation,
  (req, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id && req.body.role !== 'admin') {
      return res.status(400).json({ error: 'No puedes quitarte tu propio rol de administrador.' });
    }

    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, targetId);
    res.json({ message: 'Rol actualizado correctamente.' });
  }
);

router.patch(
  '/users/:id/status',
  [param('id').isInt(), body('active').isBoolean().withMessage('Valor invalido.').toBoolean()],
  handleValidation,
  (req, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id && req.body.active === false) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta.' });
    }

    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(req.body.active ? 1 : 0, targetId);
    res.json({ message: req.body.active ? 'Usuario reactivado.' : 'Usuario desactivado.' });
  }
);

router.get('/stats', (req, res) => {
  const byStatus = db
    .prepare(`SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`)
    .all();

  const statusCounts = { pendiente: 0, en_curso: 0, completada: 0 };
  byStatus.forEach((row) => {
    statusCounts[row.status] = row.count;
  });

  const mostActiveUsers = db
    .prepare(
      `SELECT users.id, users.email, COUNT(tasks.id) AS task_count
       FROM users
       LEFT JOIN tasks ON tasks.owner_id = users.id
       GROUP BY users.id
       ORDER BY task_count DESC, users.email ASC
       LIMIT 10`
    )
    .all();

  const totals = db
    .prepare(`SELECT (SELECT COUNT(*) FROM users) AS totalUsers, (SELECT COUNT(*) FROM tasks) AS totalTasks`)
    .get();

  res.json({
    statusCounts,
    totalUsers: totals.totalUsers,
    totalTasks: totals.totalTasks,
    mostActiveUsers: mostActiveUsers.map((u) => ({ id: u.id, email: u.email, taskCount: u.task_count })),
  });
});

module.exports = router;
