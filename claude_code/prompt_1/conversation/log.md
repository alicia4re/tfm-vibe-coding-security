# Conversación con Claude Code — Prompt 1

**Fecha**: 2026-07-13
**Herramienta**: Claude Code (extensión de VS Code)
**Versión**: claude-code/2.1.207
**Framework**: Next.js 16 (App Router)
**Plan**: cuenta asociada (plan no expuesto en la UI de la extensión)
**Duración**: 26 minutos (medidos con Toggl Track)
**Turnos**: 1 (un único prompt, sin preguntas de vuelta, sin fixes)

---

## Turno 1 — Prompt inicial

[Prompt 1 estándar — mismo texto exacto que el resto de herramientas]

### Generación

Claude Code, en su extensión para Visual Studio Code, generó la aplicación completa a partir de un único prompt en 26 minutos. No formuló ninguna pregunta al usuario. Seleccionó como stack Next.js 16.2.10 (App Router, Turbopack) + React 19 + Prisma 5.22 + SQLite + bcryptjs + jose (JWT, HS256) + nodemailer + Zod, empaquetado con Docker Compose (Dockerfile multi-stage + docker-compose.yml + docker-entrypoint.sh).

La aplicación arrancó al primer intento con `docker compose up`, accesible en http://localhost:3000. No hubo despliegue público: la aplicación se ejecuta localmente para el análisis dinámico, siguiendo el mismo criterio metodológico aplicado a GitHub Copilot y Cursor.

---

## Observaciones

- Turnos hasta app funcional: 1.
- Empaquetado con Docker Compose: es la única herramienta evaluada que produce infraestructura como código sin haberlo pedido explícitamente el prompt.
- Longitud mínima de contraseña: 8 caracteres (por encima del umbral de 6 observado en el resto de herramientas evaluadas).
- Nodemailer declarado como "^9.0.3": versión inexistente en el registro de npm; en la instalación real npm resuelve al último release estable de nodemailer 6. Documentado como observación, no como hallazgo.
- Detalle de los hallazgos de seguridad: ver metadata.yaml.

---

## Nota metodológica — CC-F000

La primera ejecución de este Prompt 1 con Claude Code se realizó desde la raíz del repositorio del TFM y con permiso para explorar el árbol de ficheros. El agente leyó el código previamente generado por GitHub Copilot (subcarpeta `github_copilot/prompt_1/code/`) y reprodujo el mismo stack (Node.js + Express + SQLite + React/Vite + nodemailer), rompiendo el aislamiento metodológico entre herramientas.

Los artefactos de esa ejecución se conservan en `claude_code/prompt_1_DESCARTADA_evidencia_CC-F000/` como evidencia. La ejecución que se reporta como definitiva es esta repetición, realizada abriendo VS Code únicamente en la subcarpeta `claude_code/prompt_1/`, sin acceso a los directorios de otras herramientas. Se aplica el mismo criterio en todas las ejecuciones posteriores del TFM.
