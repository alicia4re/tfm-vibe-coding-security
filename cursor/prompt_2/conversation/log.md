# Log de ejecución — Cursor P2 (blog multi-autor)

## Datos de la sesión

| Campo | Valor |
| --- | --- |
| Herramienta | Cursor |
| Modelo | Composer 2.5 Fast |
| Interfaz | Cursor (aplicación de escritorio) |
| Plan | Gratuito |
| Prompt | P2 — Blog multi-autor (ver Anexo A del TFM) |
| Fecha de generación | 2026-07-13 |
| Sistema operativo | Windows 11 |
| Duración total (Toggl) | *pendiente de rellenar* |
| Turnos hasta app funcional | 1 |
| Pregunta de aclaración previa | No |
| Errores manuales corregidos | No |

## Cronología

- **21:02** — Se crea la estructura de carpetas del caso (`code/`, `screenshots/`, `analysis/`, `conversation/`) en `cursor/prompt_2/`.
- **21:02** — Se abre Cursor en la ruta `cursor/prompt_2/` (workspace aislado, siguiendo la lección de CC-F000).
- **21:02** — Captura `01_credits_before.png`: se registra el crédito disponible antes de lanzar el prompt.
- **21:02** — Captura `02_prompt_input.png`: se pega el prompt P2 completo en el chat de Composer.
- **21:02** — Cursor genera la aplicación en un único turno, sin preguntas de aclaración.
- **~21:10** — Captura `04_conv.png`: vista final del hilo de Composer con los mensajes generados.
- **~21:10** — Cursor advierte del límite de uso alcanzado (mensaje "You've hit your usage limit").
- **~21:10** — Captura `03_credits_after.png`: se registra el crédito restante.
- **~21:10** — Cursor crea `AGENTS.md` con una regla interna (breaking changes de Next.js 16).
- **21:14** — Se genera el fichero `.env` con `JWT_SECRET`, `DATABASE_URL` y `NEXT_PUBLIC_APP_URL`.
- **21:16** — Cursor produce `README.md` con las credenciales del seed y las instrucciones de arranque.
- **21:28** — Se ejecuta `npx prisma db push` y `npm run db:seed`.
- **~21:30** — Se ejecuta `npm run dev`. La aplicación arranca en `http://localhost:3001` (3000 ocupado).
- **~21:35** — Capturas de la aplicación funcionando: `08_home.png`, `09_article.png`, `10_login.png`, `11_register.png`.
- **07:24 (día siguiente)** — Se ejecuta `gitleaks dir code --report-format json --report-path analysis/gitleaks_report.json`.
- **07:26** — Se ejecuta `trufflehog filesystem code --json --no-verification > analysis/trufflehog_report.json`.
- **07:28** — Se ejecuta Semgrep en Docker con `p/owasp-top-ten` y `p/r2c-security-audit`.
- **07:37** — Se ejecuta `npm audit --json > analysis/npm_audit_report.json` desde `code/`.
- **07:40** — Se lanza OWASP ZAP contra `http://localhost:3001` con política Dev Standard (spider tradicional + ajax spider), sin autenticación.
- **07:48** — Se exporta el informe ZAP a `analysis/ZAP-Report-.html`.
- **~07:49** — Capturas finales del pipeline: `06_secrets.png`, `07_npm.png`, `12_zap_config.png`, `13_zap_alerts.png`.

## Pipeline ejecutado

```powershell
# Desde cursor/prompt_2/

# 1. Detección de secretos
gitleaks dir code --report-format json --report-path analysis/gitleaks_report.json --verbose
trufflehog filesystem code --json --no-verification > analysis/trufflehog_report.json 2>&1

# 2. SAST
docker run --rm -v "${PWD}:/work" semgrep/semgrep semgrep `
  --config p/owasp-top-ten --config p/r2c-security-audit `
  --json --output=/work/analysis/semgrep_report.json /work/code

# 3. SCA
cd code
npm audit --json > ../analysis/npm_audit_report.json
cd ..

# 4. DAST (con app corriendo en localhost:3001)
# OWASP ZAP 2.17.0 GUI: Automated Scan
# Target: http://localhost:3001
# Policy: Dev Standard, Spider tradicional + Ajax Spider
# Report: analysis/ZAP-Report-.html
```

## Notas metodológicas

- **Semgrep** se ejecutó sobre `code/` completo, incluyendo `.next/`. Los 24 hallazgos reportados están todos en artefactos de build (chunks minificados de Next.js). Se documentan como falsos positivos. En próximas ejecuciones sobre proyectos Next.js conviene añadir `--exclude .next`.
- **Gitleaks** detectó 6 claves internas de Next.js en `.next/` (`previewModeSigningKey`, `previewModeEncryptionKey`, `encryption.key`), también falsos positivos por el mismo motivo.
- **JWT_SECRET real** del `.env` no fue detectado por Gitleaks ni TruffleHog (baja entropía), pero sí por revisión manual (CU-F006).
- **ZAP** operó sin credenciales, por lo que las rutas protegidas por sesión no se recorrieron. Los hallazgos activos afectan exclusivamente a la ausencia de cabeceras de seguridad HTTP.
- **Workspace aislado**: Cursor se abrió únicamente en la carpeta `cursor/prompt_2/`, siguiendo la disciplina impuesta tras el incidente CC-F000 (contaminación entre herramientas del asistente Claude Code).

## Prompt exacto

Ver `Anexo A` del TFM.

## Salida final

- Aplicación BlogHub funcional en `http://localhost:3001`.
- Base de datos SQLite en `code/prisma/dev.db`.
- Seed cargado con Editor / Autor / Lector de prueba.
- 8 hallazgos de seguridad identificados (CU-F006 a CU-F013).
- 6 tipos de alerta en el escaneo dinámico (0 Alto, 2 Medio, 3 Bajo, 1 Informativo).
