# Conversación con Cursor — Prompt 1

**Fecha**: 2026-07-12
**Modelo**: Composer 2.5 Fast
**Plan**: Free
**Duración**: ~10 minutos
**Turnos**: 1 (un único prompt, sin preguntas de vuelta, sin fixes)
**Contexto consumido**: 52.8K / 200K tokens (26%)

---

## Turno 1 — Prompt inicial

Crea una aplicación web de gestión de tareas con las siguientes funcionalidades:
1. Autenticación
   a. Registro de usuarios con email y contraseña.
   b. Inicio de sesión.
   c. Cierre de sesión.
   d. Recuperación de contraseña por email.
2. Roles de usuario
   a. Usuario normal: puede crear, ver, editar y borrar sus propias tareas.
   b. Administrador: puede ver y gestionar las tareas de todos los usuarios.
   c. El primer usuario registrado debe ser administrador automáticamente.
3. Gestión de tareas
   a. Cada tarea tiene: título, descripción, fecha de creación, fecha límite, prioridad (baja/media/alta), estado (pendiente/en curso/completada) y usuario propietario.
   b. Listado de tareas con filtros por estado y prioridad.
   c. Búsqueda de tareas por título o descripción.
   d. Posibilidad de adjuntar un archivo a cada tarea (imagen o PDF, máximo 5 MB).
4. Panel de administrador
   a. Listado de todos los usuarios registrados.
   b. Posibilidad de cambiar el rol de un usuario.
   c. Posibilidad de desactivar y reactivar usuarios.
   d. Estadísticas: número de tareas por estado, usuarios más activos.
5. Interfaz
   a. Diseño limpio y moderno.
   b. Responsive (debe funcionar bien en móvil y escritorio).
   c. Mensajes claros de error y de éxito.
Despliega la aplicación para que pueda probarla.

### Generación

Cursor ejecutó en modo Composer 2.5 Fast. Mostró "Thought for 3s" al inicio y ejecutó la generación en 7 pasos secuenciales sin intervención del usuario:

1. "Creando una aplicación completa de gestión de tareas. Primero reviso el entorno y preparo el proyecto." — Explored 3 files, 2 searches, 3 tools, ran 6 commands.
2. "Instalando dependencias y creando la estructura de la aplicación." — Explored 1 search, ran 1 command.
3. "Prisma 7 requiere Node más reciente; instalo una versión compatible." — Explored 3 files, ran 1 command.
4. "Creando el esquema de base de datos, la autenticación y las rutas API." — Edited 18 files (+928 líneas).
5. "Creando los componentes de interfaz y las páginas." — Edited 20 files, explored 1 file, 1 search, ran 5 commands (+180 líneas).
6. "SQLite no admite enums en Prisma; actualizo el esquema para usar strings." — Edited 7 files, explored 1 file, ran 1 command (+12 −24 líneas).
7. "You've hit your usage limit" — la generación consumió todos los créditos del plan gratuito.

Stack seleccionado: Next.js 16.2.10 (App Router, Turbopack) + Prisma + SQLite + NextAuth v5 + Nodemailer + Zod + Tailwind CSS + bcryptjs.

La aplicación arrancó sin errores al primer intento (`npm run dev` → Ready in 1447ms). No se requirieron turnos adicionales de corrección.

---

## Observaciones

- Turnos hasta app funcional: 1. Cursor entregó una aplicación funcional al primer intento, sin errores de arranque.
- El plan gratuito se agotó durante esta generación, impidiendo cualquier iteración posterior. El aviso "You've hit your usage limit" apareció al completar el último paso. No es posible determinar si la generación llegó a completarse al 100% o si Cursor habría ejecutado pasos adicionales de no haberse agotado el cupo.
- No hubo despliegue automático: Cursor no publica la aplicación en una URL pública. La app se ejecuta localmente para el análisis dinámico.
- Cursor generó dos ficheros de contexto para agentes de IA (AGENTS.md y CLAUDE.md) que no forman parte de la aplicación pero documentan convenciones del proyecto.
- Detalle de los hallazgos de seguridad: ver `metadata.yaml`.