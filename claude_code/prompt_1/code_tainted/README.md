# Task Manager

Aplicación web de gestión de tareas con autenticación, roles de usuario
(usuario normal / administrador), adjuntos de archivos y panel de
administración.

## Stack

- **Backend**: Node.js + Express, SQLite (`better-sqlite3`), JWT en cookie
  `httpOnly`, `bcryptjs`, `multer` (adjuntos), `nodemailer` (recuperación de
  contraseña), `helmet`, `express-rate-limit`, `express-validator`.
- **Frontend**: React 18 + Vite, React Router, Axios. CSS propio (sin
  frameworks), diseño responsive.

## Estructura

```
code/
  server/   API REST (Express) + base de datos SQLite
  client/   SPA en React (Vite)
```

## Requisitos

- Node.js 18+ y npm.

## Puesta en marcha (modo desarrollo)

```bash
# 1. Instalar dependencias de servidor y cliente
npm run install-all

# 2. Configurar variables de entorno del servidor
cp server/.env.example server/.env
# Edita server/.env y define JWT_SECRET con un valor aleatorio largo.

# 3. Arrancar servidor (puerto 4000) y cliente (puerto 5173) a la vez
npm run dev
```

Abre **http://localhost:5173** en el navegador. El cliente proxya las
peticiones `/api` al backend en el puerto 4000 (ver `client/vite.config.js`).

## Despliegue / modo producción (local)

```bash
npm run install-all
cp server/.env.example server/.env   # edita JWT_SECRET, y pon NODE_ENV=production
npm run start
```

`npm start` compila el frontend (`client/dist`) y arranca el servidor Express,
que sirve tanto la API (`/api/*`) como los ficheros estáticos del frontend
compilado. Con `NODE_ENV=production` en `server/.env`, la cookie de sesión se
marca `Secure` (requiere HTTPS) y el servidor deja de intentar mandar el
enlace de recuperación de contraseña en la respuesta JSON.

La app queda disponible en **http://localhost:4000** (o el `PORT` que se
configure en `server/.env`).

Para desplegarla en un proveedor externo (Render, Railway, un VPS, etc.):
sirve `server/` como servicio Node con `npm start`, con `client/dist` ya
generado por `npm run build` en el mismo directorio, un volumen persistente
para `server/data/` (SQLite) y `server/uploads/` (adjuntos), y variables de
entorno reales (`JWT_SECRET`, SMTP, `CLIENT_ORIGIN`) en lugar de los valores
de ejemplo.

## Primer usuario = administrador

El primer usuario que se registra en la aplicación recibe automáticamente el
rol `admin`. El resto de registros se crean como `user`.

## Recuperación de contraseña sin SMTP configurado

Si no se rellenan `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` en `server/.env`,
el servidor entra en "modo desarrollo": en lugar de enviar el correo,
imprime el enlace de recuperación en la consola del servidor y (solo si
`NODE_ENV` no es `production`) lo devuelve también en la respuesta de la API,
para poder probar el flujo completo sin credenciales SMTP reales. La pantalla
"He olvidado mi contraseña" muestra ese enlace directamente cuando está
disponible.

Para enviar correos reales, configura un proveedor SMTP (por ejemplo
Mailtrap, Gmail con contraseña de aplicación, SendGrid, etc.) en
`server/.env`.

## Adjuntos

Cada tarea admite un único archivo adjunto (imagen JPG/PNG/GIF o PDF, máximo
5 MB). El servidor valida tanto el `mimetype` declarado como la firma real
(magic bytes) del contenido del fichero antes de aceptarlo, y genera un
nombre de archivo aleatorio en disco para evitar colisiones y "path
traversal".

## Variables de entorno del servidor (`server/.env`)

Ver `server/.env.example` para la lista completa y su descripción.

## Scripts disponibles

Desde la raíz de `code/`:

| Comando               | Descripción                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run install-all`  | Instala dependencias de `server/` y `client/`.        |
| `npm run dev`           | Arranca servidor y cliente en modo desarrollo.        |
| `npm run build`         | Compila el frontend a `client/dist`.                  |
| `npm start`             | Compila el frontend y arranca el servidor en producción. |
