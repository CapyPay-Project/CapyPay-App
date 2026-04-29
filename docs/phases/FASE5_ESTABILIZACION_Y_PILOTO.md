# Fase 5 - Estabilizacion, Experimento y Piloto

## Objetivo

Llevar CapyPay de estado funcional a estado operable en uso real con control de riesgo.

## Alcance implementado en esta fase

1. Observabilidad backend:

  - Logs estructurados por request (metodo, ruta, status, latencia).
  - Metricas operativas en memoria (trafico, error rate, latencia p95).
  - Endpoints operativos:
    - `GET /ops/health`
    - `GET /ops/metrics` (protegible con `OPS_METRICS_TOKEN`)
    - `GET /ops/metrics/prometheus` (scrape para dashboard externo)
    - `GET /ops/alerts/status`

1. Seguridad operativa:

  - Endpoints criticos de gamificacion ya protegidos por rate limit (Sprint 4.4).
  - Endpoint de metricas protegido por token opcional de operacion.

1. Base de QA:

  - Pruebas unitarias de servicios criticos de gamificacion (claim/streak).
  - Prueba base de snapshot de observabilidad.

## Plan en 3 sprints

### Sprint 5.1 - Hardening operativo

Checklist:

- [x] `requestMetrics` en backend
- [x] endpoint de salud
- [x] endpoint de metricas operativas
- [x] alertas externas (Discord/Slack/email)
- [x] dashboard externo (Grafana/Datadog)

### Sprint 5.2 - Calidad UX + regresion

Checklist:

- [x] matriz de regresion de flujos principales
- [x] smoke E2E en login -> dashboard -> misiones -> claim -> notificaciones
- [x] validacion UX mobile de dashboard y niveles
- [x] afinar textos de error y mensajes vacios

Artefactos Sprint 5.2:
- Matriz QA: `docs/qa/QA_SPRINT_5_2_MATRIZ_REGRESION.md`
- Smoke E2E: `tests/e2e/sprint5_2.smoke.spec.ts`
- Config E2E: `playwright.config.ts`

### Sprint 5.3 - Piloto y go/no-go

Checklist:

- [x] habilitar piloto de bajo riesgo (5-10% usuarios)
- [x] revisar KPIs diarios
- [x] ejecutar plan de rollback probado
- [x] decision go/no-go documentada

Artefactos Sprint 5.3:
- Plantilla KPI diario: `docs/pilot/PILOTO_KPI_DIARIO_TEMPLATE.md`
- Plantilla GO/NO-GO: `docs/pilot/PILOTO_GO_NO_GO_TEMPLATE.md`
- Plan de rollback: `docs/pilot/PILOTO_ROLLBACK_PLAN.md`
- Estado piloto (ops): `GET /ops/pilot/status`

## KPIs operativos minimos

1. Error rate global API: < 2% diario.
1. p95 de endpoints dashboard/gamification: < 700ms.
1. Claims fallidos por validacion inesperada: < 5%.
1. Duplicidad de recompensa: 0 casos.

## Runbook rapido

1. Ver salud:

  `GET /ops/health`

1. Ver metricas:

  `GET /ops/metrics`

  Header opcional si se configuro token:

  `x-ops-token: <OPS_METRICS_TOKEN>`

1. Export para dashboard externo (Prometheus):

  `GET /ops/metrics/prometheus`

1. Estado de alertas:

  `GET /ops/alerts/status`

1. Variables para alertas externas:

  - `OPS_ALERT_WEBHOOK_URL`
  - `OPS_ALERT_COOLDOWN_SEC` (default 300)
  - `OPS_ALERT_MIN_REQUESTS` (default 30)
  - `OPS_ALERT_ERROR_RATE_THRESHOLD` (default 0.05)
  - `OPS_ALERT_P95_MS_THRESHOLD` (default 1000)

1. Comandos locales:

  - Backend test: `npm test`
  - Frontend build: `npm run build`
  - Smoke E2E: `npm run e2e:smoke`
  - Smoke E2E (headed): `npm run e2e:smoke:headed`

1. Variables de piloto:

  - `PILOT_ENABLED` (`true|false`)
  - `PILOT_ROLLOUT_PERCENT` (0-100)
  - `PILOT_ALLOWLIST` (csv opcional de userId)
  - `PILOT_BLOCKLIST` (csv opcional de userId)

## Criterio de cierre de Fase 5

- Build y test verdes en backend/frontend.
- Endpoint de salud y metricas respondiendo correctamente.
- Checklist de regresion ejecutado.
- KPIs del piloto dentro de umbrales definidos.
