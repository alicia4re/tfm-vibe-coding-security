# Conversación con Bolt.new — Prompt 2

**Fecha**: 2026-07-13
**Herramienta**: Bolt.new (editor web)
**Plan**: free
**Framework**: Vite 5 + React 18 (SPA, sin SSR)
**Backend**: Bolt Database (basado en Supabase) + Supabase Edge Functions (Deno)
**Duración**: PENDIENTE (medir con Toggl Track)
**Turnos**: 1 (un único prompt, sin preguntas de vuelta, sin fixes)

---

## Turno 1 — Prompt inicial

[Prompt 2 estándar — mismo texto exacto que el resto de herramientas]

### Generación

Bolt.new, en su editor web, generó la aplicación completa a partir de un único prompt sin formular preguntas al usuario. Como primera acción mostró el plan de ejecución y lo aplicó de forma automática. Activó Bolt Database y generó los siguientes artefactos:

- Una única migración SQL con el esquema completo (`profiles`, `articles`, `comments`), las tres tablas con RLS habilitada, las policies de acceso, los índices, los triggers de `updated_at` y el trigger `handle_new_user` que asigna rol `editor` al primer usuario registrado y `reader` a los siguientes.
- Dos edge functions Deno bajo `supabase/functions/`:
  - `link-preview`: fetch de una URL enviada por el cliente y extracción de metadatos OpenGraph.
  - `public-api`: API de lectura de artículos publicados, autenticada por un token personal almacenado en `profiles.api_token`.
- Un frontend SPA con Vite 5 + React 18 + Tailwind CSS 3, con navegación gestionada por estado local (sin biblioteca de routing) y con un sanitizador HTML propio (`SafeHtml.tsx`) con whitelist estricta de etiquetas, en lugar de DOMPurify.

Bolt.new no incorporó ni Zod ni react-hook-form: la validación de entrada se limita a los atributos HTML (`required`, `minLength={6}`) y a las comprobaciones del cliente de Supabase.

El código no se versiona automáticamente en GitHub, por lo que se exportó desde la interfaz y se copió a `bolt_new_ai/prompt_2/code/` en el repositorio del TFM. La aplicación quedó publicada en `https://multi-author-blog-we-7dib.bolt.host`, lo que permitió ejecutar el análisis dinámico contra la URL desplegada.

### Interacción con el investigador

Ninguna. Bolt.new no formuló preguntas durante la generación.

---

## Observaciones

- Turnos hasta app funcional: 1.
- Superficies nuevas del Prompt 2 respecto al Prompt 1: contenido enriquecido por autores y comentaristas (renderizado con sanitizador propio), API pública autenticada por token con `SERVICE_ROLE_KEY` (BP2-F004) y edge function de preview de enlaces con SSRF vigente (BP2-F003).
- Reproducción exacta de B-F001 del Prompt 1: escalada de privilegios porque el rol vive como columna de `profiles` y la policy de UPDATE no restringe qué columnas puede modificar el propio usuario (BP2-F001). Es evidencia de patrón sistemático de la herramienta.
- Aparece un hallazgo adicional de control de acceso: la policy de INSERT de `articles` no valida el rol, por lo que un `reader` puede insertar directamente un artículo con `status='published'` (BP2-F002).
- Bolt.new implementa un sanitizador HTML propio con whitelist estricta en lugar de DOMPurify. Se aplica de forma consistente en las tres páginas que muestran contenido de usuario. Al tratarse de una SPA sin SSR, no reproduce el bug de sanitizado SSR observado en Lovable (LP2-F001).
- Persisten los patrones B-F002 (`.env` con clave anon versionada → BP2-F006) y B-F004 (contraseña mínima 6 caracteres → BP2-F005) del Prompt 1.
- Detalle de los hallazgos de seguridad: ver `metadata.yaml`.
