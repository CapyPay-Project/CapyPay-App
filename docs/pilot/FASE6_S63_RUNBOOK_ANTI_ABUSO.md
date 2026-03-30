# Fase 6.3 - Runbook anti-abuso

Guia operativa para responder a actividad anomala en gamificacion.

## 1) Verificar estado del sistema

1. Revisar salud general: GET /ops/health.
2. Revisar metricas operativas: GET /ops/metrics.
3. Revisar resumen de riesgo por usuario:
   - GET /api/gamification/risk/summary?userId=<USER_ID>
   - Header: x-ops-token cuando aplique.

## 2) Interpretar resultado de riesgo

Campos clave:

- score: puntaje total (0-100).
- level: low, medium, high, critical.
- factors: desglose de señales (actividad, claims, repeticion).
- recommendedLimits: limites adaptativos para progress y claim.
- override: estado de revision manual activa.

Regla sugerida:

- low/medium: monitoreo normal.
- high: seguimiento activo + revisar historial de eventos.
- critical: bloquear temporalmente y abrir revision manual.

## 3) Revisar evidencia de eventos

Consultar en gamification_events (ultima ventana de tiempo):

- event_type in ('risk_alert', 'risk_rate_limited', 'risk_blocked', 'reward_claimed', 'mission_progressed').
- Validar patron repetitivo y frecuencia.

## 4) Aplicar override manual

### Bloquear temporalmente

POST /api/gamification/risk/review/:userId/override

Body JSON:

{
  "action": "block",
  "durationMin": 120,
  "reason": "review_required",
  "actor": "ops"
}

### Habilitar temporalmente (si fue falso positivo)

POST /api/gamification/risk/review/:userId/override

Body JSON:

{
  "action": "allow",
  "durationMin": 60,
  "reason": "false_positive",
  "actor": "ops"
}

## 5) Criterio de cierre de incidente

1. score desciende a low/medium de forma sostenida.
2. no hay nuevos risk_blocked injustificados.
3. usuario legitimo recupera flujo normal sin regresion.
4. registrar post-mortem corto (causa, accion, ajuste de umbrales).

## 6) Ajustes de configuracion recomendados

Config en gamification_config.key = anti_abuse:

- thresholds
- scoreWeights
- adaptiveLimits
- alerting.cooldownSec

Aplicar cambios con upsert y validar 24h antes de nuevos ajustes.
