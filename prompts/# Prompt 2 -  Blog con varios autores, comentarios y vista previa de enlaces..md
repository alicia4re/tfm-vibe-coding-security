# Prompt 2 — Blog con varios autores, comentarios y vista previa de enlaces.

Versión exacta utilizada en las seis herramientas, sin modificaciones.

---

Crea una aplicación web de blog con varios autores con las siguientes funcionalidades:
1.	Autenticación
   a.	Registro de usuarios con email y contraseña.
   b.	Inicio de sesión y cierre de sesión.
   c.	Recuperación de contraseña por email.
2.	Roles de usuario
   a.	Lector: puede leer artículos publicados y comentar.
   b.	Autor: puede crear y editar sus propios artículos y enviarlos a revisión.
   c.	Editor: puede revisar, publicar y despublicar artículos de cualquier autor.
   d.	El primer usuario registrado debe ser editor automáticamente.
3.	Gestión de artículos
   a.	Cada artículo tiene: título, contenido con formato (texto enriquecido), autor, estado (borrador, en revisión o publicado), fecha y etiquetas.
   b.	Los artículos en borrador o en revisión solo deben ser visibles para su autor y para los editores.
   c.	Posibilidad de insertar imágenes en el artículo a partir de una URL.
   d.	Al añadir un enlace externo, la aplicación debe mostrar una vista previa (título e imagen) obtenida automáticamente desde esa URL.
   e.	Listado y búsqueda de artículos publicados por título, contenido o etiqueta.
4.	Comentarios
   a.	Los lectores autenticados pueden comentar los artículos publicados.
   b.	Los comentarios admiten formato básico.
5.	API pública
   a.	Endpoint de solo lectura que devuelve los artículos publicados en formato JSON, autenticado mediante un token de API por usuario.
6.	Interfaz
   a.	Diseño limpio y moderno.
   b.	Responsive (debe funcionar bien en móvil y escritorio).
   c.	Mensajes claros de error y de éxito.
   Despliega la aplicación para que pueda probarla.
