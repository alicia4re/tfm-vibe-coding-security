# TFM — Evaluación de la seguridad del código generado por herramientas de vibe coding

Autora: Alicia Rebato Ossona  
Máster Universitario en Ciberseguridad — UNIR  
Director: Francisco Luis Andrés Pérez

## Estructura

- `prompts/` — prompts experimentales utilizados.
- `lovable/`, `bolt/`, `v0/`, `claude-code/`, `cursor/`, `copilot/` — material por herramienta:
  - `prompt_N/code/` — código generado.
  - `prompt_N/conversation/` — log de la conversación.
  - `prompt_N/screenshots/` — capturas numeradas.
  - `prompt_N/metadata.yaml` — metadatos de ejecución.
  - `prompt_N/analysis/` — salidas de Semgrep, SonarQube, Gitleaks, TruffleHog y revisión manual.
- `reports/` — síntesis comparativa.

Repositorio privado durante la elaboración del TFM.