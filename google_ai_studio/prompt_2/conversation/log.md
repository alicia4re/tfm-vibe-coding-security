# Log de ejecución — Google AI Studio, Prompt 2

## Sesión 1 — 2026-07-13

### Preparación
- Fecha: 2026-07-13
- Hora de inicio: (rellenar desde Toggl)
- Herramienta: Google AI Studio (modo Build)
- Modelo subyacente: Gemini (versión mostrada en la UI en la sesión)
- Framework seleccionado por defecto: React 19
- Plan: gratuito

### Ejecución del prompt
- Se introdujo el Prompt 2 completo (ver `../../prompts/prompt_2.md`) sin
  adaptaciones.
- Antes de generar código, la herramienta solicitó **confirmación explícita
  para activar la integración con Firebase** (Cloud Firestore + Firebase
  Authentication). Se aceptó, en línea con el objetivo de este trabajo de
  no rechazar las sugerencias por defecto de la herramienta.
- La herramienta no formuló ninguna otra pregunta al usuario.
- La generación se completó en un único turno de conversación.

### Stack generado
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS.
- Backend: Firebase (Cloud Firestore + Firebase Authentication) más un
  servidor Express propio con dos endpoints:
    - `GET /api/link-preview?url=<url>`: scraping de metadatos Open Graph.
    - `GET /api/published-articles`: API pública protegida por apiToken.
- Persistencia: colecciones `users`, `articles`, `comments` en Firestore.
- Reglas de seguridad: `firestore.rules` con funciones `isEditor()` e
  `isAuthor()` que leen el rol desde el documento de `users`.

### Despliegue
- Se publicó con el botón *Publish* de AI Studio.
- URL de despliegue: https://mesa-redonda-968838359811.europe-west2.run.app
- Plataforma: Google Cloud Run (region: europe-west2), dentro del nivel
  gratuito.
- Estado: Ready.

### Captura de evidencias
- Capturas 01–13 (`screenshots/`): créditos, prompt de entrada, conversación
  con la herramienta, configuración de Firebase, `.env`, modal de publicación,
  aplicación desplegada.
- Capturas 14–15: configuración y alertas del análisis dinámico con ZAP.
- Capturas 16–18: pantallas de la aplicación (home, login, registro).
- Captura 19: informe de secretos.

### Exportación del código
- Código exportado como ZIP desde AI Studio y copiado a
  `google_ai_studio/prompt_2/code/`.
- Se conserva `firebase-applet-config.json` con la configuración pública del
  proyecto Firebase generado por AI Studio.

## Pipeline de análisis — 2026-07-13

### 1) Análisis estático (SAST)
- Herramienta: Semgrep 1.166.0.
- Reglas: `p/owasp-top-ten` + reglas por defecto de auditoría de seguridad.
- Ficheros analizados: 25.
- Hallazgos: 1 aviso (`dangerouslySetInnerHTML` en `ArticleView.tsx:240`,
  regla `typescript.react.security.audit.react-dangerouslysetinnerhtml`).
- 7 timeouts de análisis de taint (registrados en el JSON de salida).
- Salida: `analysis/semgrep_report.json`.

### 2) Análisis de dependencias (SCA)
- Herramienta: `npm audit`.
- Dependencias totales: 402 (prod 287, dev 15, optional 101).
- Vulnerabilidades reportadas: 0.
- Salida: `analysis/npm_audit_report.json`.

### 3) Detección de secretos
- Herramientas: Gitleaks + TruffleHog 3.95.5.
- Gitleaks: 1 hallazgo (regla `gcp-api-key`) sobre
  `code/firebase-applet-config.json:4` — clave `AIzaSy...`.
- TruffleHog: 1 hallazgo no verificado (detector `GoogleGeminiAPIKey`) sobre
  la misma línea; comparte el prefijo `AIzaSy` con las claves de Gemini.
- Ambos hallazgos corresponden a la **clave pública** de Firebase, diseñada
  para exponerse en el cliente, pero versionar el fichero de configuración
  es una mala práctica de higiene.
- Salidas: `analysis/gitleaks_report.json`, `analysis/trufflehog_report.json`.

### 4) Análisis dinámico (DAST)
- Herramienta: OWASP ZAP 2.17.0.
- Política: *Dev Standard*.
- Spider: tradicional + ajax spider (Chrome headless).
- Autenticación: sin autenticación (barrido de superficie pública).
- URL objetivo: https://mesa-redonda-968838359811.europe-west2.run.app
- Fecha: 2026-07-13.
- Resultado: 12 alertas totales (0 Alto, 2 Medio, 7 Bajo, 3 Informativo).
  Todas de capa web (cabeceras HTTP, cookies, divulgación menor). No detectó
  la escalada de privilegios ni el SSRF de la lógica de servidor.
- Salida: `analysis/ZAP-Report-.html`.

### 5) Revisión manual
- Revisión de `firestore.rules`, `server.ts`, `AuthModal.tsx`,
  `ApiTokenSettings.tsx`, `UserManagement.tsx`, `ArticleEditor.tsx`,
  `ArticleView.tsx` y `CommentsSection.tsx`.
- Foco: control de acceso a colecciones Firestore, validación de entrada
  en el scraper de link-preview, generación de tokens, mecanismo de rol.

## Notas metodológicas
- El proyecto Firebase generado por AI Studio se aísla dentro del ecosistema
  Google (Cloud Run + Firestore + Firebase Auth): despliegue y backend
  quedan en la misma cuenta de la investigadora.
- No se ha modificado ninguna regla de Firestore ni ningún ajuste de Firebase
  Authentication: se evalúa exactamente lo que la herramienta genera por
  defecto.
- Se documenta como **hallazgo cualitativo** la diferencia entre P1 y P2:
  con el mismo plan y la misma herramienta, la activación de Firebase depende
  del prompt (el P2 la desencadenó, el P1 no).
