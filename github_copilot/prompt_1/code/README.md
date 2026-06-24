# Gestor de Tareas

Aplicación web de gestión de tareas con autenticación, roles de usuario, adjuntos y panel de administración.

## Características

- Registro de usuarios con email y contraseña.
- Inicio y cierre de sesión.
- Recuperación de contraseña por email.
- Roles: usuario normal y administrador.
- El primer usuario registrado se convierte en administrador.
- CRUD de tareas con título, descripción, fecha límite, prioridad, estado y adjuntos.
- Filtros por estado, prioridad y búsqueda por título/descripcion.
- Administrador puede gestionar usuarios, cambiar roles y activar/desactivar cuentas.
- Panel de estadísticas con tareas por estado y usuarios más activos.
- Interfaz responsive y diseño moderno.

## Requisitos

- Node.js 18+.

## Instalación

1. Abre una terminal en esta carpeta.
2. Ejecuta:

```bash
npm install
```

## Ejecución

```bash
npm start
```

Luego abre `http://localhost:3000`.

## Email de recuperación

Si no configuras SMTP, la app utiliza un buzón de prueba de Nodemailer y mostrará la URL de previsualización en la consola.

### Configuración opcional de SMTP

Puedes usar variables de entorno en un archivo `.env`:

```env
PORT=3000
SESSION_SECRET=mi_secreto_seguro
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=usuario
SMTP_PASS=contraseña
EMAIL_FROM=soporte@tareas.local
```

## Estructura

- `app.js`: servidor Express.
- `db.js`: conexión SQLite.
- `views/`: plantillas EJS.
- `public/css/style.css`: estilos.
- `uploads/`: archivos adjuntos.

## Notas

- La base de datos se crea automáticamente en `data.sqlite`.
- El primer usuario registrado será administrador.
