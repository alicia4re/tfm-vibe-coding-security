# Gestión de Tareas

Aplicación web de gestión de tareas con autenticación, roles (usuario/administrador),
archivos adjuntos y panel de administración.

## Ejecutar con Docker (recomendado)

```bash
docker compose up -d --build
```

La aplicación estará disponible en **http://localhost:3000**.

El primer usuario que se registre se convierte automáticamente en **administrador**.
Los datos (base de datos SQLite y archivos adjuntos) se guardan en volúmenes Docker
persistentes (`task_app_data`, `task_app_uploads`), así que sobreviven a reinicios.

Para detener la aplicación: `docker compose down` (los datos se conservan).
Para borrar también los datos: `docker compose down -v`.

## Recuperación de contraseña (modo demo)

No hay un proveedor SMTP real configurado. Al pedir "¿Olvidaste tu contraseña?", la
app crea automáticamente una bandeja de pruebas gratuita en [Ethereal Email](https://ethereal.email/)
y muestra en pantalla un enlace de "vista previa del email" con el correo que se
habría enviado. Para usar un SMTP real en producción, define las variables de
entorno `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` en `docker-compose.yml`.

## Desarrollo local (sin Docker)

```bash
npm install
npx prisma db push
npm run dev
```

Requiere Node.js 20.19+ (o ajustar la versión de `prisma` si usas una versión
anterior de Node, como se hizo en este proyecto para Node 20.12).

## Estructura

- `src/app` — páginas (App Router) y rutas de API
- `src/lib` — autenticación, base de datos (Prisma), validación, email, almacenamiento de archivos
- `src/components` — componentes de UI compartidos
- `prisma/schema.prisma` — modelo de datos (User, Task, PasswordResetToken)
