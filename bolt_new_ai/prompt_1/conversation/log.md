# Conversación con Bolt.new — Prompt 1

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
Bolt generó la aplicación completa a partir de un único prompt, sin formular
preguntas al usuario ni requerir intervención. Antes de ejecutar, mostró un
"Plan" con los pasos previstos: configurar el proyecto base (dependencias,
Tailwind, estructura), crear las migraciones de base de datos (perfiles, tareas,
RLS, storage), configurar el cliente de Bolt Database y el contexto de
autenticación, crear componentes de UI reutilizables, implementar la página de
autenticación, la gestión de tareas, la carga de adjuntos, el panel de
administrador y el diseño responsive.

Bolt activó automáticamente su backend (Bolt Database, basado en Supabase) y
generó dos migraciones SQL: el esquema de profiles y tasks con sus políticas
RLS y el bucket de almacenamiento, y un segundo fichero con funciones RPC de
estadísticas para el panel de administrador.

## Observaciones
La conversación fue unidireccional: un prompt, generación automática completa.
Bolt incorpora un panel "Security Audit" propio que, tras la generación,
reporta 8 avisos (warnings) sobre funciones SECURITY DEFINER ejecutables por
los roles anon y authenticated.
Detalle de los hallazgos: ver metadata.yaml

---