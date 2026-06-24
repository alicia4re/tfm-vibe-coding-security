require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const methodOverride = require('method-override');
const { run, get, all } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: __dirname }),
    secret: process.env.SESSION_SECRET || 'tareas-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  })
);
app.use(flash());

app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

async function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

let mailer;
createTransporter().then((transporter) => {
  mailer = transporter;
});

async function sendEmail(to, subject, html) {
  if (!mailer) return;
  const info = await mailer.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@tareas.local',
    to,
    subject,
    html
  });
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('Preview email:', nodemailer.getTestMessageUrl(info));
  }
}

async function ensureAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Necesitas iniciar sesión.');
    return res.redirect('/login');
  }
  next();
}

async function ensureAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Acceso denegado.');
    return res.redirect('/tasks');
  }
  next();
}

async function initDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    reset_token TEXT,
    reset_expires INTEGER
  )`);

  await run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    due_date INTEGER,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    attachment TEXT,
    attachment_name TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 16);
}

function stateLabel(state) {
  const labels = {
    pendiente: 'Pendiente',
    'en curso': 'En curso',
    completada: 'Completada'
  };
  return labels[state] || state;
}

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/tasks');
  res.redirect('/login');
});

app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));
app.get('/forgot', (req, res) => res.render('forgot'));

app.post('/register', async (req, res) => {
  const { email, password, confirm } = req.body;
  if (!email || !password || password !== confirm) {
    req.flash('error', 'Revisa los datos del formulario.');
    return res.redirect('/register');
  }

  const existing = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) {
    req.flash('error', 'Este email ya está registrado.');
    return res.redirect('/register');
  }

  const count = await get('SELECT COUNT(*) as total FROM users');
  const role = count.total === 0 ? 'admin' : 'user';
  const hash = await bcrypt.hash(password, 12);
  await run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email.toLowerCase(), hash, role]);
  req.flash('success', 'Registro completado. Ya puedes iniciar sesión.');
  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    req.flash('error', 'Email o contraseña incorrecta.');
    return res.redirect('/login');
  }
  if (!user.active) {
    req.flash('error', 'Tu cuenta está desactivada.');
    return res.redirect('/login');
  }
  req.session.user = { id: user.id, email: user.email, role: user.role };
  req.flash('success', 'Bienvenido de nuevo.');
  res.redirect('/tasks');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.post('/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) {
    req.flash('success', 'Si existe la cuenta, recibirás un email con instrucciones.');
    return res.redirect('/forgot');
  }

  const token = Math.random().toString(36).substring(2, 18);
  const expires = Date.now() + 1000 * 60 * 60;
  await run('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [token, expires, user.id]);
  const resetUrl = `${req.protocol}://${req.get('host')}/reset/${token}`;
  await sendEmail(user.email, 'Recuperación de contraseña', `<p>Haz clic aquí para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`);
  req.flash('success', 'Te hemos enviado un email con las instrucciones.');
  res.redirect('/login');
});

app.get('/reset/:token', async (req, res) => {
  const user = await get('SELECT * FROM users WHERE reset_token = ? AND reset_expires > ?', [req.params.token, Date.now()]);
  if (!user) {
    req.flash('error', 'Token inválido o expirado.');
    return res.redirect('/forgot');
  }
  res.render('reset', { token: req.params.token });
});

app.post('/reset/:token', async (req, res) => {
  const { password, confirm } = req.body;
  if (!password || password !== confirm) {
    req.flash('error', 'Las contraseñas no coinciden.');
    return res.redirect(`/reset/${req.params.token}`);
  }

  const user = await get('SELECT * FROM users WHERE reset_token = ? AND reset_expires > ?', [req.params.token, Date.now()]);
  if (!user) {
    req.flash('error', 'Token inválido o expirado.');
    return res.redirect('/forgot');
  }

  const hash = await bcrypt.hash(password, 12);
  await run('UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hash, user.id]);
  req.flash('success', 'Contraseña actualizada. Ya puedes iniciar sesión.');
  res.redirect('/login');
});

app.get('/tasks', ensureAuth, async (req, res) => {
  const { status, priority, q } = req.query;
  const where = [];
  const params = [];

  if (req.session.user.role !== 'admin') {
    where.push('tasks.user_id = ?');
    params.push(req.session.user.id);
  }

  if (status) {
    where.push('tasks.status = ?');
    params.push(status);
  }

  if (priority) {
    where.push('tasks.priority = ?');
    params.push(priority);
  }

  if (q) {
    where.push('(tasks.title LIKE ? OR tasks.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const tasks = await all(`SELECT tasks.*, users.email as owner_email FROM tasks JOIN users ON users.id = tasks.user_id ${whereSQL} ORDER BY tasks.due_date ASC`, params);
  res.render('tasks', { tasks, filters: { status, priority, q }, formatDate, stateLabel });
});

app.get('/tasks/new', ensureAuth, (req, res) => {
  res.render('task-form', { task: {}, action: '/tasks', method: 'POST' });
});

app.post('/tasks', ensureAuth, upload.single('attachment'), async (req, res) => {
  const { title, description, due_date, priority, status } = req.body;
  if (!title || !priority || !status) {
    req.flash('error', 'Título, prioridad y estado son obligatorios.');
    return res.redirect('/tasks/new');
  }

  await run(`INSERT INTO tasks (title, description, created_at, due_date, priority, status, user_id, attachment, attachment_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    title,
    description,
    Date.now(),
    due_date ? new Date(due_date).getTime() : null,
    priority,
    status,
    req.session.user.id,
    req.file ? `/uploads/${req.file.filename}` : null,
    req.file ? req.file.originalname : null
  ]);

  req.flash('success', 'Tarea creada correctamente.');
  res.redirect('/tasks');
});

app.get('/tasks/:id/edit', ensureAuth, async (req, res) => {
  const task = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task) return res.redirect('/tasks');
  if (req.session.user.role !== 'admin' && task.user_id !== req.session.user.id) {
    req.flash('error', 'No tienes permiso para editar esta tarea.');
    return res.redirect('/tasks');
  }
  res.render('task-form', { task, action: `/tasks/${task.id}?_method=PUT`, method: 'POST' });
});

app.put('/tasks/:id', ensureAuth, upload.single('attachment'), async (req, res) => {
  const task = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task) return res.redirect('/tasks');
  if (req.session.user.role !== 'admin' && task.user_id !== req.session.user.id) {
    req.flash('error', 'No tienes permiso para actualizar esta tarea.');
    return res.redirect('/tasks');
  }

  const { title, description, due_date, priority, status } = req.body;
  const attachment = req.file ? `/uploads/${req.file.filename}` : task.attachment;
  const attachment_name = req.file ? req.file.originalname : task.attachment_name;

  await run(`UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, attachment = ?, attachment_name = ? WHERE id = ?`, [
    title,
    description,
    due_date ? new Date(due_date).getTime() : null,
    priority,
    status,
    attachment,
    attachment_name,
    task.id
  ]);

  req.flash('success', 'Tarea actualizada.');
  res.redirect('/tasks');
});

app.delete('/tasks/:id', ensureAuth, async (req, res) => {
  const task = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task) return res.redirect('/tasks');
  if (req.session.user.role !== 'admin' && task.user_id !== req.session.user.id) {
    req.flash('error', 'No tienes permiso para eliminar esta tarea.');
    return res.redirect('/tasks');
  }
  await run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  req.flash('success', 'Tarea eliminada.');
  res.redirect('/tasks');
});

app.get('/admin', ensureAuth, ensureAdmin, async (req, res) => {
  const users = await all('SELECT id, email, role, active FROM users ORDER BY email');
  const taskStats = await all(`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`);
  const activeUsers = await all(`SELECT users.email, COUNT(tasks.id) as task_count FROM users LEFT JOIN tasks ON users.id = tasks.user_id GROUP BY users.id ORDER BY task_count DESC LIMIT 5`);
  res.render('admin', { users, taskStats, activeUsers });
});

app.post('/admin/users/:id/role', ensureAuth, ensureAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.redirect('/admin');
  await run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  req.flash('success', 'Rol actualizado.');
  res.redirect('/admin');
});

app.post('/admin/users/:id/status', ensureAuth, ensureAdmin, async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.redirect('/admin');
  await run('UPDATE users SET active = ? WHERE id = ?', [user.active ? 0 : 1, req.params.id]);
  req.flash('success', user.active ? 'Usuario desactivado.' : 'Usuario reactivado.');
  res.redirect('/admin');
});

app.use((req, res) => {
  res.status(404).render('404');
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al iniciar la base de datos:', err);
  });
