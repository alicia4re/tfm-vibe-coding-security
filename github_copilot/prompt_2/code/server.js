const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'blog.db'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'blog-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'reader',
      api_token TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      tags TEXT,
      featured_image_url TEXT,
      FOREIGN KEY(author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(article_id) REFERENCES articles(id),
      FOREIGN KEY(author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

function ensureApiToken(user) {
  if (user.api_token) return user.api_token;
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('UPDATE users SET api_token = ? WHERE id = ?').run(token, user.id);
  return token;
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getUser(req) {
  if (!req.session.user) return null;
  return db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

function canViewArticle(user, article) {
  if (!article) return false;
  if (article.status === 'published') return true;
  if (!user) return false;
  return user.role === 'editor' || article.author_id === user.id;
}

function canEditArticle(user, article) {
  if (!user || !article) return false;
  return user.role === 'editor' || article.author_id === user.id;
}

function sendPasswordResetEmail(email, token) {
  const resetUrl = `http://localhost:${port}/reset-password?token=${token}`;
  console.log(`[reset] Para ${email}: ${resetUrl}`);
  return resetUrl;
}

app.locals.stripHtml = stripHtml;
app.use((req, res, next) => {
  res.locals.user = getUser(req);
  res.locals.flash = req.session.flash;
  res.locals.stripHtml = stripHtml;
  delete req.session.flash;
  next();
});

app.get('/', (req, res) => {
  const search = (req.query.q || '').trim();
  const likeTerm = `%${search}%`;
  const articles = search
    ? db.prepare(`SELECT a.*, u.name AS author_name FROM articles a JOIN users u ON u.id = a.author_id WHERE a.status = 'published' AND (a.title LIKE ? OR a.content LIKE ? OR a.tags LIKE ?) ORDER BY a.created_at DESC`).all(likeTerm, likeTerm, likeTerm)
    : db.prepare(`SELECT a.*, u.name AS author_name FROM articles a JOIN users u ON u.id = a.author_id WHERE a.status = 'published' ORDER BY a.created_at DESC`).all();
  res.render('index', { articles, search, title: 'Inicio' });
});

app.get('/dashboard', requireAuth, (req, res) => {
  const currentUser = getUser(req);
  const articles = db.prepare(`SELECT a.*, u.name AS author_name FROM articles a JOIN users u ON u.id = a.author_id WHERE a.author_id = ? ORDER BY a.updated_at DESC`).all(currentUser.id);
  res.render('dashboard', { articles, title: 'Mis artículos' });
});

app.get('/register', (req, res) => res.render('register', { title: 'Registro' }));
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.render('register', { title: 'Registro', error: 'El correo ya está registrado.' });
  }
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const role = userCount === 0 ? 'editor' : 'reader';
  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(24).toString('hex');
  const now = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO users (name, email, password_hash, role, api_token, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(name, email, passwordHash, role, token, now);
  req.session.user = { id: result.lastInsertRowid, name, email, role };
  req.session.flash = { type: 'success', message: `Bienvenido${role === 'editor' ? ' editor' : ''}.` };
  res.redirect('/');
});

app.get('/login', (req, res) => res.render('login', { title: 'Iniciar sesión' }));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.render('login', { title: 'Iniciar sesión', error: 'Credenciales inválidas.' });
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.render('login', { title: 'Iniciar sesión', error: 'Credenciales inválidas.' });
  }
  ensureApiToken(user);
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  req.session.flash = { type: 'success', message: 'Sesión iniciada correctamente.' };
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/request-reset', (req, res) => res.render('request-reset', { title: 'Recuperar contraseña' }));
app.post('/request-reset', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.render('request-reset', { title: 'Recuperar contraseña', error: 'No existe una cuenta con ese correo.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);
  const resetUrl = sendPasswordResetEmail(email, token);
  res.render('request-reset', { title: 'Recuperar contraseña', success: `Revisa tu correo. En esta demo el enlace es: ${resetUrl}` });
});

app.get('/reset-password', (req, res) => {
  const { token } = req.query;
  const entry = db.prepare('SELECT * FROM password_resets WHERE token = ?').get(token);
  if (!entry || new Date(entry.expires_at) < new Date()) {
    return res.render('reset-password', { title: 'Restablecer contraseña', error: 'El enlace ya no es válido.' });
  }
  res.render('reset-password', { title: 'Restablecer contraseña', token });
});

app.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const entry = db.prepare('SELECT * FROM password_resets WHERE token = ?').get(token);
  if (!entry || new Date(entry.expires_at) < new Date()) {
    return res.render('reset-password', { title: 'Restablecer contraseña', error: 'El enlace ya no es válido.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, entry.user_id);
  db.prepare('DELETE FROM password_resets WHERE token = ?').run(token);
  res.render('reset-password', { title: 'Restablecer contraseña', success: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
});

app.get('/articles/new', requireAuth, (req, res) => res.render('article-form', { title: 'Nuevo artículo', article: null, mode: 'create' }));
app.post('/articles/new', requireAuth, (req, res) => {
  const currentUser = getUser(req);
  const { title, content, status, tags, featured_image_url } = req.body;
  if (!title || !content) {
    return res.render('article-form', { title: 'Nuevo artículo', article: null, mode: 'create', error: 'Título y contenido son obligatorios.' });
  }
  const safeStatus = status === 'published' && currentUser.role !== 'editor' ? 'in_review' : status;
  const articleId = db.prepare(`INSERT INTO articles (title, content, author_id, status, tags, featured_image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(title, content, currentUser.id, safeStatus || 'draft', tags || '', featured_image_url || '', new Date().toISOString(), new Date().toISOString()).lastInsertRowid;
  req.session.flash = { type: 'success', message: 'Artículo guardado correctamente.' };
  res.redirect(`/articles/${articleId}`);
});

app.get('/articles/:id', (req, res) => {
  const article = db.prepare(`SELECT a.*, u.name AS author_name, u.role AS author_role FROM articles a JOIN users u ON u.id = a.author_id WHERE a.id = ?`).get(req.params.id);
  if (!article) {
    return res.status(404).render('error', { title: 'No encontrado', message: 'No existe ese artículo.' });
  }
  const currentUser = getUser(req);
  if (!canViewArticle(currentUser, article)) {
    return res.status(403).render('error', { title: 'Acceso restringido', message: 'Este artículo aún no está publicado.' });
  }
  const comments = db.prepare(`SELECT c.*, u.name AS author_name FROM comments c JOIN users u ON u.id = c.author_id WHERE c.article_id = ? ORDER BY c.created_at ASC`).all(article.id);
  res.render('article', { title: article.title, article, comments, canEdit: canEditArticle(currentUser, article) });
});

app.get('/articles/:id/edit', requireAuth, (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) {
    return res.status(404).render('error', { title: 'No encontrado', message: 'No existe ese artículo.' });
  }
  const currentUser = getUser(req);
  if (!canEditArticle(currentUser, article)) {
    return res.status(403).render('error', { title: 'Acceso denegado', message: 'No puedes editar este artículo.' });
  }
  res.render('article-form', { title: 'Editar artículo', article, mode: 'edit' });
});

app.post('/articles/:id/edit', requireAuth, (req, res) => {
  const currentUser = getUser(req);
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article || !canEditArticle(currentUser, article)) {
    return res.status(403).render('error', { title: 'Acceso denegado', message: 'No puedes editar este artículo.' });
  }
  const { title, content, status, tags, featured_image_url } = req.body;
  if (!title || !content) {
    return res.render('article-form', { title: 'Editar artículo', article, mode: 'edit', error: 'Título y contenido son obligatorios.' });
  }
  let safeStatus = status;
  if (status === 'published' && currentUser.role !== 'editor') {
    safeStatus = 'in_review';
  }
  if (safeStatus === 'published' && currentUser.role !== 'editor') {
    safeStatus = 'in_review';
  }
  if (currentUser.role !== 'editor' && article.status === 'published') {
    safeStatus = 'in_review';
  }
  db.prepare(`UPDATE articles SET title = ?, content = ?, status = ?, tags = ?, featured_image_url = ?, updated_at = ? WHERE id = ?`)
    .run(title, content, safeStatus || article.status, tags || '', featured_image_url || '', new Date().toISOString(), article.id);
  req.session.flash = { type: 'success', message: 'Artículo actualizado.' };
  res.redirect(`/articles/${article.id}`);
});

app.post('/articles/:id/status', requireAuth, (req, res) => {
  const currentUser = getUser(req);
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article || currentUser.role !== 'editor') {
    return res.status(403).render('error', { title: 'Acceso denegado', message: 'Solo los editores pueden cambiar el estado.' });
  }
  const { status } = req.body;
  db.prepare(`UPDATE articles SET status = ?, updated_at = ? WHERE id = ?`).run(status, new Date().toISOString(), article.id);
  req.session.flash = { type: 'success', message: 'Estado actualizado.' };
  res.redirect(`/articles/${article.id}`);
});

app.post('/articles/:id/comments', requireAuth, (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article || article.status !== 'published') {
    return res.status(403).render('error', { title: 'Acceso denegado', message: 'Solo puedes comentar artículos publicados.' });
  }
  const { content } = req.body;
  if (!content) {
    return res.redirect(`/articles/${article.id}`);
  }
  db.prepare('INSERT INTO comments (article_id, author_id, content, created_at) VALUES (?, ?, ?, ?)')
    .run(article.id, req.session.user.id, content, new Date().toISOString());
  req.session.flash = { type: 'success', message: 'Comentario publicado.' };
  res.redirect(`/articles/${article.id}`);
});

app.get('/api/articles', (req, res) => {
  const authHeader = req.headers.authorization || req.headers['x-api-key'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader || null);
  const user = token ? db.prepare('SELECT * FROM users WHERE api_token = ?').get(token) : null;
  if (!user) {
    return res.status(401).json({ error: 'Token de API requerido' });
  }
  const articles = db.prepare(`SELECT a.id, a.title, a.content, a.created_at, a.tags, a.featured_image_url, u.name AS author_name FROM articles a JOIN users u ON u.id = a.author_id WHERE a.status = 'published' ORDER BY a.created_at DESC`).all();
  res.json(articles);
});

app.get('/api/preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Se requiere una URL' });
  try {
    const response = await fetch(url);
    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/is);
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);
    const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Sin título';
    const image = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;
    res.json({ title, image });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo obtener la vista previa' });
  }
});

app.use((req, res) => {
  res.status(404).render('error', { title: 'No encontrado', message: 'La página que buscas no está disponible.' });
});

initDb();
app.listen(port, () => {
  console.log(`Blog listo en http://localhost:${port}`);
});
