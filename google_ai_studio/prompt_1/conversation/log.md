# Conversación con Google AI Studio — Prompt 1

**Fecha**: 2026-07-12
**Modelo**: Gemini 3.5 Flash
**Framework**: React
**Plan**: Free
**Duración**: 405 segundos (~6 min 45 s)
**Turnos**: 1 (un único prompt, sin preguntas de vuelta, sin fixes)

---

## Turno 1 — Prompt inicial

[Prompt 1 estándar — mismo texto exacto que el resto de herramientas]

### Generación

Google AI Studio (modo Build, modelo Gemini 3.5 Flash, framework React) generó la aplicación completa a partir de un único prompt en 405 segundos. No formuló ninguna pregunta al usuario y, en particular, no ofreció ni activó la integración con Firebase que la documentación de Google describe para este modo. Seleccionó como stack React 19 + Express + JWT + bcrypt + Multer, con persistencia en un fichero JSON local (data/db.json).

La aplicación arrancó correctamente. Al publicarla mediante el botón Publish, se desplegó automáticamente en Google Cloud Run (europe-west2), accesible en https://gestor-de-tareas.ai.studio.

---

## Observaciones

- Turnos hasta app funcional: 1.
- Ausencia de Firebase: pese a que la documentación de Google (Firebase, 2026) describe integración con Firestore, Firebase Authentication y Cloud Storage, la herramienta no la activó ni la mencionó. Generó un backend propio con base de datos en fichero. Se documenta como resultado cualitativo.
- Despliegue automático en Cloud Run al publicar, dentro del nivel gratuito.
- Detalle de los hallazgos de seguridad: ver metadata.yaml.