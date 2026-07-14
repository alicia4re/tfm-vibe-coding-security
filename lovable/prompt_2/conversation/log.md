# Conversación con Lovable — Prompt 2

**Fecha**: 2026-07-13
**Herramienta**: Lovable (AI Editor + Lovable Cloud)
**Plan**: free
**Framework**: TanStack Start (React 19 + Vite 8)
**Backend**: Lovable Cloud (basado en Supabase)
**Duración**: PENDIENTE (medir con Toggl Track)
**Turnos**: 1 (un único prompt, sin preguntas de vuelta, sin fixes)

---

## Turno 1 — Prompt inicial

[Prompt 2 estándar — mismo texto exacto que el resto de herramientas]

### Generación

Lovable, en su AI Editor, generó la aplicación completa a partir de un único prompt sin formular preguntas al usuario. Como primera acción activó Lovable Cloud automáticamente, replicando el patrón observado en el Prompt 1 (F001). Seleccionó como stack TanStack Start + React 19 + Vite 8 + Tailwind CSS 4 + Zod + react-hook-form + `marked` + DOMPurify, sobre Supabase (Lovable Cloud).

Generó dos migraciones SQL:

1. La primera migración crea las cuatro tablas del esquema (`profiles`, `user_roles`, `articles`, `comments`), habilita RLS en todas ellas y define las políticas de acceso, la función `has_role` con `SECURITY DEFINER`, el trigger `handle_new_user` que asigna rol `editor` al primer usuario y `reader` a los siguientes, y el trigger `enforce_publish_role` que exige rol `editor` para publicar artículos.

2. La segunda migración incluye `REVOKE ALL ... FROM PUBLIC, anon, authenticated` sobre las tres funciones `SECURITY DEFINER` internas (`handle_new_user`, `enforce_publish_role`, `update_updated_at_column`) y sobre `has_role` respecto al rol anónimo, y otorga `EXECUTE` de `has_role` únicamente al rol `authenticated`. Corrige por diseño el hallazgo F002 del Prompt 1.

El código se subió a un repositorio privado de GitHub creado por la propia plataforma y se copió a `lovable/prompt_2/code/` en el repositorio del TFM. La aplicación quedó publicada en `https://author-verse-write.lovable.app`, lo que permitió ejecutar el análisis dinámico contra la URL desplegada, siguiendo el mismo criterio metodológico aplicado a Lovable y Bolt.new en el Prompt 1.

### Interacción con el investigador

Ninguna. Lovable no formuló preguntas durante la generación.

---

## Observaciones

- Turnos hasta app funcional: 1.
- Se activó Lovable Cloud automáticamente, sin confirmación (replica F001 del Prompt 1).
- Nuevas superficies de ataque introducidas por el Prompt 2 respecto al Prompt 1: contenido enriquecido por usuarios (Markdown + comentarios), API pública autenticada por token y edge function con fetch de URL arbitraria. Estas tres superficies materializan los hallazgos LP2-F001 (XSS SSR), LP2-F003 (token en query + service_role) y LP2-F002 (SSRF).
- Aprendizaje entre iteraciones: la segunda migración corrige por diseño el hallazgo F002 del Prompt 1 (funciones SECURITY DEFINER ejecutables por roles anónimo y autenticado).
- Persisten los patrones de F003 y F004 del Prompt 1: `.env` con la clave publishable de Supabase incluido en el repositorio (LP2-F006) y longitud mínima de contraseña de 6 caracteres (LP2-F005).
- Detalle de los hallazgos de seguridad: ver `metadata.yaml`.
