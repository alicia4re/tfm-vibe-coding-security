const express = require('express');
const fs = require('fs');
const path = require('path');
const { body, query, param, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadsDir, verifyFileSignature } = require('../middleware/upload');

const router = express.Router();

const PRIORITIES = ['baja', 'media', 'alta'];
const STATUSES = ['pendiente', 'en_curso', 'completada'];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: task.created_at,
    dueDate: task.due_date,
    priority: task.priority,
    status: task.status,
    ownerId: task.owner_id,
    ownerEmail: task.owner_email,
    attachment: task.attachment_filename
      ? {
          url: `/api/tasks/${task.id}/attachment`,
          originalName: task.attachment_original_name,
          mimetype: task.attachment_mimetype,
          size: task.attachment_size,
        }
      : null,
  };
}

function loadTaskForUser(taskId, user) {
  const task = db
    .prepare(
      `SELECT tasks.*, users.email AS owner_email FROM tasks
       JOIN users ON users.id = tasks.owner_id
       WHERE tasks.id = ?`
    )
    .get(taskId);
  if (!task) return null;
  if (user.role !== 'admin' && task.owner_id !== user.id) return undefined; // marcador de "sin permiso"
  return task;
}

router.use(requireAuth);

router.get(
  '/',
  [
    query('status').optional().isIn(STATUSES),
    query('priority').optional().isIn(PRIORITIES),
    query('search').optional().isString().trim().isLength({ max: 200 }),
  ],
  handleValidation,
  (req, res) => {
    const { status, priority, search } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role !== 'admin') {
      conditions.push('tasks.owner_id = ?');
      params.push(req.user.id);
    }
    if (status) {
      conditions.push('tasks.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('tasks.priority = ?');
      params.push(priority);
    }
    if (search) {
      conditions.push('(tasks.title LIKE ? OR tasks.description LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const tasks = db
      .prepare(
        `SELECT tasks.*, users.email AS owner_email FROM tasks
         JOIN users ON users.id = tasks.owner_id
         ${where}
         ORDER BY tasks.created_at DESC`
      )
      .all(...params);

    res.json({ tasks: tasks.map(serializeTask) });
  }
);

router.post(
  '/',
  upload.single('attachment'),
  [
    body('title').trim().notEmpty().withMessage('El titulo es obligatorio.').isLength({ max: 200 }),
    body('description').optional({ checkFalsy: true }).isString().isLength({ max: 5000 }),
    body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha limite invalida.'),
    body('priority').optional({ checkFalsy: true }).isIn(PRIORITIES).withMessage('Prioridad invalida.'),
    body('status').optional({ checkFalsy: true }).isIn(STATUSES).withMessage('Estado invalido.'),
  ],
  (req, res, next) => {
    // Ejecutamos la validacion despues de multer para que los errores de
    // campos de texto tambien se comprueben cuando se envia un fichero.
    handleValidation(req, res, next);
  },
  (req, res) => {
    if (req.file && !verifyFileSignature(req.file.path, req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El contenido del archivo no coincide con su tipo declarado.' });
    }

    const { title, description = '', dueDate = null, priority = 'media', status = 'pendiente' } = req.body;

    const result = db
      .prepare(
        `INSERT INTO tasks (title, description, due_date, priority, status, owner_id, attachment_filename, attachment_original_name, attachment_mimetype, attachment_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title,
        description,
        dueDate,
        priority,
        status,
        req.user.id,
        req.file ? req.file.filename : null,
        req.file ? req.file.originalname : null,
        req.file ? req.file.mimetype : null,
        req.file ? req.file.size : null
      );

    const task = loadTaskForUser(result.lastInsertRowid, req.user);
    res.status(201).json({ task: serializeTask(task) });
  }
);

router.put(
  '/:id',
  [param('id').isInt()],
  upload.single('attachment'),
  [
    body('title').trim().notEmpty().withMessage('El titulo es obligatorio.').isLength({ max: 200 }),
    body('description').optional({ checkFalsy: true }).isString().isLength({ max: 5000 }),
    body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha limite invalida.'),
    body('priority').isIn(PRIORITIES).withMessage('Prioridad invalida.'),
    body('status').isIn(STATUSES).withMessage('Estado invalido.'),
    body('removeAttachment').optional().isBoolean().toBoolean(),
  ],
  handleValidation,
  (req, res) => {
    const existing = loadTaskForUser(req.params.id, req.user);
    if (existing === null) return res.status(404).json({ error: 'Tarea no encontrada.' });
    if (existing === undefined) return res.status(403).json({ error: 'No tienes permiso sobre esta tarea.' });

    if (req.file && !verifyFileSignature(req.file.path, req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El contenido del archivo no coincide con su tipo declarado.' });
    }

    const { title, description = '', dueDate = null, priority, status, removeAttachment } = req.body;

    let attachmentFields = {
      filename: existing.attachment_filename,
      originalName: existing.attachment_original_name,
      mimetype: existing.attachment_mimetype,
      size: existing.attachment_size,
    };

    if (req.file) {
      if (existing.attachment_filename) {
        const oldPath = path.join(uploadsDir, existing.attachment_filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      attachmentFields = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    } else if (removeAttachment && existing.attachment_filename) {
      const oldPath = path.join(uploadsDir, existing.attachment_filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      attachmentFields = { filename: null, originalName: null, mimetype: null, size: null };
    }

    db.prepare(
      `UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, status = ?,
       attachment_filename = ?, attachment_original_name = ?, attachment_mimetype = ?, attachment_size = ?
       WHERE id = ?`
    ).run(
      title,
      description,
      dueDate,
      priority,
      status,
      attachmentFields.filename,
      attachmentFields.originalName,
      attachmentFields.mimetype,
      attachmentFields.size,
      req.params.id
    );

    const task = loadTaskForUser(req.params.id, req.user);
    res.json({ task: serializeTask(task) });
  }
);

router.delete('/:id', [param('id').isInt()], handleValidation, (req, res) => {
  const existing = loadTaskForUser(req.params.id, req.user);
  if (existing === null) return res.status(404).json({ error: 'Tarea no encontrada.' });
  if (existing === undefined) return res.status(403).json({ error: 'No tienes permiso sobre esta tarea.' });

  if (existing.attachment_filename) {
    const filePath = path.join(uploadsDir, existing.attachment_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tarea eliminada correctamente.' });
});

router.get('/:id/attachment', [param('id').isInt()], handleValidation, (req, res) => {
  const existing = loadTaskForUser(req.params.id, req.user);
  if (existing === null) return res.status(404).json({ error: 'Tarea no encontrada.' });
  if (existing === undefined) return res.status(403).json({ error: 'No tienes permiso sobre esta tarea.' });
  if (!existing.attachment_filename) return res.status(404).json({ error: 'Esta tarea no tiene archivo adjunto.' });

  const filePath = path.join(uploadsDir, existing.attachment_filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'El archivo ya no esta disponible.' });

  res.download(filePath, existing.attachment_original_name || existing.attachment_filename);
});

module.exports = router;
