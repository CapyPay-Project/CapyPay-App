# Fase 7.4 - Validacion rollback/fallback (S74-004)

Fecha: 2026-03-30
Estado: COMPLETADO

## Objetivo

Validar que las optimizaciones anti-saturacion de Fase 7 degradan de forma controlada ante fallos lentos (fallback) y recuperan operacion normal tras ventana de enfriamiento (rollback tactico sin downtime).

## Alcance validado

1. Circuit breaker en `getWeeklySummary` con fallback controlado.
2. Recuperacion automatica tras cooldown (half-open -> closed).
3. Estabilidad post-recuperacion mediante corrida corta de carga spike.

## Evidencia de prueba

### 1) Precondicion operativa

- `GET /ops/health` respondio `200 OK`.
- Snapshot previo: `traffic.errorRate=0` y telemetria activa.

### 2) Drill de fallback y recovery

Prueba ejecutada sobre `GET /api/gamification/summary/weekly` con secuencia controlada:

1. Solicitudes con `userId` invalido para forzar degradacion por timeout en dependencia lenta.
2. Solicitud valida durante ventana degradada.
3. Espera de cooldown (~22s).
4. Solicitud valida post-cooldown.

Resultado observado:

- `firstInvalid`: `source=phase7_circuit_fallback`, `reason=timeout`, `error="Circuit timeout after 1000ms"`.
- `secondInvalid`: `source=phase7_circuit_fallback`, mismo patron de timeout.
- `validDuringOpen`: `source=phase7_circuit_fallback` (degradacion controlada, sin 5xx).
- `validAfterCooldown`: `source=phase6_weekly_summary`, `cache.hit=true` (recuperacion funcional confirmada).

Interpretacion:

- El sistema evita cascada de errores en estado degradado.
- La recuperacion tras cooldown retorna a fuente normal sin intervencion manual.

### 3) Estabilidad post-recovery

Comando:

```bash
npm run load:spike -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --warmupSec 4 --spikeSec 8 --recoverySec 4 --spikePeakConcurrency 20
```

Resultado:

- Requests: 669
- Throughput: 31.86 rps
- Error rate: 0.00%
- Timeouts: 0
- Latencia avg: 380.13 ms
- Latencia p95: 1016 ms
- Latencia p99: 1388 ms

Snapshot `/ops/metrics` post-run:

- `traffic.errorRate`: 0
- `traffic.latencyMs.p95`: 999

## Conclusiones

1. Criterio fallback cumplido: degradacion controlada y trazable (`phase7_circuit_fallback`) sin 5xx durante fallo lento inducido.
2. Criterio rollback tactico cumplido: recuperacion automatica tras cooldown hacia `phase6_weekly_summary`.
3. Criterio estabilidad post-recuperacion cumplido: error rate 0% y latencia p95 estable en corrida de verificacion.

## Decision

S74-004 se marca como **DONE**. La fase queda lista para consolidacion final en S74-005.