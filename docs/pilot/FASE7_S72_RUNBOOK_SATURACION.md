# Fase 7 - Sprint 7.2 Runbook de saturacion

Guia operativa para responder picos de carga y degradacion en rutas criticas de gamificacion.

## Alcance

Rutas objetivo:

- GET /api/gamification/summary/weekly
- GET /api/gamification/metrics/summary
- POST /api/gamification/missions/:id/progress
- POST /api/gamification/missions/:id/claim
- POST /api/gamification/rewards/:id/claim

Controles implementados:

- Cache por clave con invalidacion selectiva.
- Presupuesto de concurrencia por ruta critica.
- Rate-limit adaptativo por riesgo y capacidad.
- Circuit breaker con fallback degradado en resumen semanal y metricas.

## Senales de alerta

Disparadores para activar este runbook:

1. p95 >= 900 ms en /ops/metrics durante >= 5 minutos.
2. Error rate >= 5% en /ops/metrics durante >= 5 minutos.
3. Aumento sostenido de 429 en rutas de progress/claim.
4. Respuestas con source = phase7_circuit_fallback en summary/metrics con frecuencia elevada.

## Diagnostico rapido (primeros 5 minutos)

1. Verificar estado operativo:
   - GET /ops/health
   - GET /ops/metrics
   - GET /ops/alerts/status
2. Confirmar saturacion por ruta:
   - revisar metrics.routes en /ops/metrics
   - identificar rutas con p95 alto y error rate alto
3. Confirmar protecciones activas:
   - revisar presencia de 429 controlados en progress/claim
   - revisar respuestas degradadas de circuit breaker en summary/metrics

## Contencion inmediata (5-15 minutos)

1. Reducir presion en escrituras:
   - bajar temporalmente max en rate-limit de progress/claim via configuracion de riesgo (override si aplica).
2. Priorizar lecturas estables:
   - mantener summary/metrics en modo fallback controlado mientras baja presion.
3. Evitar cascada:
   - mantener concurrency budget activo (no deshabilitar salvo incidente mayor).

## Ajuste de circuit breaker (si persiste saturacion)

Variables disponibles:

- GM_CB_WEEKLY_FAILURE_THRESHOLD
- GM_CB_WEEKLY_COOLDOWN_MS
- GM_CB_WEEKLY_TIMEOUT_MS
- GM_CB_METRICS_FAILURE_THRESHOLD
- GM_CB_METRICS_COOLDOWN_MS
- GM_CB_METRICS_TIMEOUT_MS

Regla operativa:

1. Si hay timeout frecuente, reducir timeout_ms para cortar mas rapido.
2. Si hay ruido transitorio, subir failure_threshold para evitar apertura prematura.
3. Si la dependencia tarda en recuperar, subir cooldown_ms para disminuir probing.

## Criterios de recuperacion

Se considera recuperado cuando por >= 15 minutos:

1. p95 < 650 ms.
2. error rate < 3%.
3. no hay incremento sostenido de 429.
4. cae la frecuencia de source = phase7_circuit_fallback.

## Rollback tactico

Aplicar si no mejora en 30 minutos o hay impacto de negocio alto:

1. Activar plan de rollback del piloto: docs/pilot/PILOTO_ROLLBACK_PLAN.md.
2. Revertir cambios recientes de configuracion (rate limits/overrides).
3. Mantener observabilidad reforzada y registrar timeline del incidente.

## Evidencia minima post-incidente

Registrar en el informe diario:

1. Ventana del incidente (inicio/fin).
2. KPIs antes, durante y despues (p95, error rate, 429).
3. Acciones aplicadas y su efecto.
4. Cambios de configuracion temporales y si fueron revertidos.
5. Decision final: estable / monitoreo reforzado / rollback parcial.
