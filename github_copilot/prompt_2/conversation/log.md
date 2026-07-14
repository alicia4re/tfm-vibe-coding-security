# Log de ejecución — GitHub Copilot P2 (blog multi-autor)

## Datos de la sesión

| Campo | Valor |
| --- | --- |
| Herramienta | GitHub Copilot |
| Modelo | Copilot Chat (modo Agent) |
| Interfaz | Extensión de VS Code |
| Plan | Gratuito |
| Prompt | P2 — Blog multi-autor (ver Anexo A del TFM) |
| Fecha de generación | 2026-07-13 |
| Sistema operativo | Windows 11, Node.js v20.12.1 |
| Duración total (Toggl) | *pendiente de rellenar* |
| Turnos hasta app funcional | *pendiente — revisar capturas 04-08_conv.png* |
| Pregunta de aclaración previa | No |
| Errores manuales corregidos | No |

## Cronología

- **18:59** — Se crea la estructura de carpetas (`code/`, `screenshots/`, `analysis/`, `conversation/`).
- **~19:00** — Captura `01_credits_before.png`.
- **~19:00** — Se pega el prompt P2 en Copilot Chat (modo Agent). Captura `02_prompt_input.png`.
- **~19:05** — Capturas del hilo de conversación: `04_conv.png` a `08_conv.png`.
- **19:05** — Copilot genera server.js (340 líneas), vistas EJS, CSS, JS cliente.
- **~19:07** — Se ejecuta `npm install` (118 paquetes, 0 vulnerabilidades).
- **~19:10** — Captura `03_credits_after.png`.
- **19:13** — Se ejecuta `npm run dev`. Error EADDRINUSE :3000.
- **~19:15** — Se mata proceso en :3000 o se cambia puerto. App arranca.
- **~19:20** — Capturas de la app: `09_home.png`, `10_login.png`, `11_register.png`.
- **09:26 (día siguiente)** — Gitleaks: 0 leaks.
- **09:26** — TruffleHog: 0 secretos (2386 chunks).
- **~09:28** — Semgrep: 6 hallazgos (todos express-cookie-settings).
- **~09:30** — npm audit: 0 vulnerabilidades.
- **~09:40** — OWASP ZAP contra localhost:3000, spider + ajax spider, Dev Standard.
- **~09:50** — Exporta informe ZAP. Capturas `12_zap_config.png`, `13_zap_alerts.png`.

## Pipeline ejecutado

```powershell
# Desde github_copilot/prompt_2/

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

# 4. DAST
# OWASP ZAP 2.17.0 GUI: Automated Scan
# Target: http://localhost:3000
# Policy: Dev Standard, Spider tradicional + Ajax Spider
# Report: analysis/ZAP-Report-.html
```

## Notas metodológicas

- **Semgrep** reportó exactamente los mismos 6 hallazgos de express-cookie-settings que en P1 (GC-F001 → GC-F010 en P2), patrón reproducible de la herramienta.
- **npm audit**: 0 vulnerabilidades. Stack mínimo (5 dependencias directas, 118 totales).
- **ZAP** operó sin credenciales. Detectó tokens CSRF ausentes (Medio), alerta que no aparece en Cursor P2 porque Next.js configura sameSite=lax por defecto.
- **Workspace aislado**: VS Code abierto únicamente en `github_copilot/prompt_2/`.

## Salida final

- Aplicación BlogHub funcional en `http://localhost:3000`.
- Base de datos SQLite en `code/blog.db`.
- 9 hallazgos de seguridad identificados (GC-F005 a GC-F013).
- 9 tipos de alerta en el escaneo dinámico (0 Alto, 3 Medio, 3 Bajo, 3 Informativo).
