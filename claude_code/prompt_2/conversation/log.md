# Log de ejecución — Claude Code P2 (blog multi-autor)

## Datos de la sesión

| Campo | Valor |
| --- | --- |
| Herramienta | Claude Code |
| Modelo | claude-code (versión ejecutada durante la sesión) |
| Interfaz | Extensión de VS Code |
| Plan | Gratuito |
| Prompt | P2 — Blog multi-autor (ver Anexo A del TFM) |
| Fecha de generación | 2026-07-13 |
| Sistema operativo | Windows 11 |
| Duración total (Toggl) | *pendiente de rellenar* |
| Turnos hasta app funcional | *pendiente — hay capturas 04-25_conv.png que reflejan un flujo largo con múltiples turnos* |
| Pregunta de aclaración previa | **Sí** — Claude Code preguntó por el modo de despliegue y ofreció tres opciones; el usuario eligió la primera (local, recomendada) |
| Errores manuales corregidos | No |

## Cronología

- **21:30** — Se crea la estructura del caso (`code/`, `screenshots/`, `analysis/`, `conversation/`).
- **~21:31** — VS Code abierto exclusivamente en `claude_code/prompt_2/` (disciplina de aislamiento tras CC-F000 de P1).
- **~21:31** — Captura `01_credits_before.png` con el crédito disponible.
- **~21:31** — Se pega el prompt P2 en Claude Code. Captura `02_prompt_input.png`.
- **~21:31** — Claude Code **pregunta al usuario dónde desplegar la aplicación** y ofrece tres opciones. El usuario elige la primera (opción recomendada: despliegue local).
- **~21:32 – ~15:58** — Claude Code ejecuta la generación en varios turnos (capturas `04_conv.png` a `25_conv.png` documentan el hilo). Instala dependencias, aplica `prisma migrate deploy`, corre `prisma db seed` y ejecuta `npm run build`.
- **12:36** — Se genera el fichero `.env` con `JWT_SECRET='dev-secret-change-me-<hex 32>'` y `DATABASE_URL='file:./dev.db'`. El .env queda incluido en `.gitignore`.
- **~15:59** — Captura `03_credits_after.png` con el crédito restante.
- **~16:00** — Se arranca `npm run dev`. App disponible en `http://localhost:3000`.
- **~16:02** — Capturas de la app: `26_home.png`, `27_login_lector.png`, `28_login.png`, `29_register.png`.
- **~16:04** — Gitleaks: 5 hits (todos en `.next/`, falsos positivos).
- **~16:05** — TruffleHog: 0 secretos (21 208 chunks, 275 MB).
- **~16:06** — Semgrep: 7 hallazgos, todos en `.next/` (falsos positivos por artefactos de build).
- **~16:06** — npm audit: 2 vulnerabilidades moderate (postcss transitiva vía next).
- **~16:07** — Capturas `31_secrets.png` (resumen secrets) y `30_zap_config.png` (config ZAP).
- **~16:07** — OWASP ZAP contra `localhost:3000`: Dev Standard, spider tradicional + ajax spider, sin autenticación.
- **~16:07** — Se exporta informe ZAP a `analysis/ZAP-Report-.html`. Captura `31_zap_alerts.png`.

## Pipeline ejecutado

```powershell
# Desde claude_code/prompt_2/

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

# 4. DAST (con app corriendo en localhost:3000)
# OWASP ZAP 2.17.0 GUI: Automated Scan
# Target: http://localhost:3000
# Policy: Dev Standard, Spider tradicional + Ajax Spider
# Report: analysis/ZAP-Report-.html
```

## Notas metodológicas

- **Pregunta de aclaración previa**: Claude Code es la única herramienta que ha invocado el checklist de la metodología del TFM ("Si la herramienta plantea preguntas de aclaración antes de generar código, se responden con respuestas predefinidas..."). La respuesta dada fue "primera opción" (despliegue local, la recomendada), consistente con el enfoque adoptado para el resto de asistentes técnicos.
- **Semgrep** produjo los mismos falsos positivos en `.next/` que en Cursor P2. Se propone añadir `--exclude .next` para próximas ejecuciones en proyectos Next.js.
- **Gitleaks** detectó 5 claves internas de Next.js en `.next/dev/`, ninguna en código fuente. El JWT_SECRET del .env (documentado como CC-F010) no se detectó por su porción hex aleatoria.
- **npm audit**: idéntico resultado que Cursor P2 (postcss + next, moderate).
- **ZAP** operó sin credenciales. Las 10 alertas informativas de "atributo HTML controlable" no representan XSS explotable: todos los renders de `dangerouslySetInnerHTML` se alimentan de contenido pre-sanitizado con `sanitize-html`.
- **Workspace aislado**: VS Code abierto únicamente en `claude_code/prompt_2/`, siguiendo la disciplina impuesta tras CC-F000.

## Salida final

- Aplicación Multiblog funcional en `http://localhost:3000`.
- Base de datos SQLite en `code/prisma/dev.db`.
- Seed cargado con 4 usuarios de prueba (`editor@blog.test`, `autor@blog.test`, `autora2@blog.test`, `lector@blog.test`), contraseña común `password123`.
- 6 hallazgos de seguridad identificados (CC-F005 a CC-F010).
- 10 tipos de alerta en el escaneo dinámico (0 Alto, 4 Medio, 3 Bajo, 3 Informativo).
