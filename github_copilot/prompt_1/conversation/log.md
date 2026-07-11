# Conversación con GithubCopilot — Prompt 1

**Fecha**: 2026-06-20
**Tool version**: No expuesta en la UI
**Modo**: Build
**Duración**: 10:29 minutos
**Turnos**: 1 (un único prompt, sin preguntas de vuelta de la herramienta)

---

## Turno 1 — Usuario

Crea una aplicación web de gestión de tareas con las siguientes funcionalidades:
1.	Autenticación
a.	Registro de usuarios con email y contraseña.
b.	Inicio de sesión.
c.	Cierre de sesión.
d.	Recuperación de contraseña por email.
2.	Roles de usuario
a.	Usuario normal: puede crear, ver, editar y borrar sus propias tareas.
b.	Administrador: puede ver y gestionar las tareas de todos los usuarios.
c.	El primer usuario registrado debe ser administrador automáticamente.
3.	Gestión de tareas
a.	Cada tarea tiene: título, descripción, fecha de creación, fecha límite, prioridad (baja/media/alta), estado (pendiente/en curso/completada) y usuario propietario.
b.	Listado de tareas con filtros por estado y prioridad.
c.	Búsqueda de tareas por título o descripción.
d.	Posibilidad de adjuntar un archivo a cada tarea (imagen o PDF, máximo 5 MB).
4.	Panel de administrador
a.	Listado de todos los usuarios registrados.
b.	Posibilidad de cambiar el rol de un usuario.
c.	Posibilidad de desactivar y reactivar usuarios.
d.	Estadísticas: número de tareas por estado, usuarios más activos.
5.	Interfaz
a.	Diseño limpio y moderno.
b.	Responsive (debe funcionar bien en móvil y escritorio).
c.	Mensajes claros de error y de éxito.
Despliega la aplicación para que pueda probarla.


## Generación
Copilot ejecutó en modo Agent. Seleccionó como stack Node.js + Express + EJS server-side rendering + SQLite (fichero local) + `express-session` con almacén SQLite + Nodemailer + Multer. Generó la estructura completa del proyecto en un único turno, incluyendo:

- `app.js` (398 líneas): rutas de autenticación, gestión de tareas, panel de administración, subida de archivos y recuperación de contraseña.
- `db.js`: inicialización de esquema SQLite y funciones utilitarias.
- Vistas EJS: `login`, `register`, `forgot`, `reset`, `tasks`, `task-form`, `admin`, `404` y `partials/header`, `partials/messages`.
- `public/css/style.css`: estilos.
- `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `README.md`.

Copilot no formuló preguntas al usuario ni requirió intervención durante la generación. No creó ficheros `.env` con credenciales reales, únicamente `.env.example` con placeholders.

## Turno 2 — Fix funcional de bug EJS

**Motivo**: al ejecutar `npm start`, el servidor arrancaba correctamente en `http://localhost:3000`, pero cualquier petición devolvía error HTTP 500. El log mostraba un `SyntaxError` al compilar `views/partials/header.ejs`, causado por el uso de sintaxis EJS 2.x (`<% include partials/messages %>`) incompatible con la versión declarada en `package.json` (`ejs ^3.1.10`).

**Prompt del usuario:**

> Al ejecutar `npm start` el servidor arranca correctamente en `http://localhost:3000`, pero cualquier petición devuelve error 500. El log muestra:
>
> ```
> SyntaxError: ...\views\login.ejs:1
>  >> 1| <%- include('partials/header', { title: 'Iniciar sesión' }) %>
> Unexpected identifier 'partials' in ...\views\partials\header.ejs while compiling ejs
> ```
>
> Arréglalo por favor.

## Generación 2

Copilot inspeccionó `login.ejs` y `header.ejs`, buscó con regex otras inclusiones EJS potencialmente incompatibles y aplicó un cambio único en `views/partials/header.ejs`:

- Antes: `<% include partials/messages %>`
- Después: `<%- include('partials/messages') %>`

Ficheros modificados: 1. Líneas: +1, -1.

**Verificación**: tras aceptar el cambio, la app arranca sin error y `/login` renderiza correctamente. Se procede con el análisis de seguridad sobre esta versión corregida.



## Observaciones
- Turnos hasta app funcional: 2. Copilot generó código con sintaxis obsoleta de una plantilla EJS (`<% include %>`, eliminada desde EJS 3.0.0, año 2018) pese a declarar `ejs ^3.1.10` en el `package.json`. La intervención se resolvió en un turno adicional sin necesidad de indicar la línea ni la sintaxis correcta.
- No hubo despliegue automático: a diferencia de Lovable y Bolt, GitHub Copilot Chat en modo Agent no publica la aplicación en una URL pública. La app se ejecuta localmente para el análisis dinámico.
- Detalle de los hallazgos de seguridad: ver `metadata.yaml`.

---