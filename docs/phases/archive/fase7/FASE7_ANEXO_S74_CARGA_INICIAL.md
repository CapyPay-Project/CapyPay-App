# Fase 7.4 - Reporte inicial de carga (S74-001 y S74-002)

Fecha de ejecucion: 2026-03-30
Entorno: local
Backend: http://localhost:3000

## Objetivo

1. Diseñar una suite reproducible de carga para gamificacion (spike/soak).
2. Ejecutar pruebas iniciales sobre rutas criticas y registrar evidencia cuantitativa.

## Suite de carga implementada

Ubicacion:

- `capypay-backend/scripts/load/gamification-load-suite.mjs`
- `capypay-backend/scripts/load/README.md`

Comandos npm:

- `npm run load:spike`
- `npm run load:soak`

Cobertura por defecto (read-heavy):

- `GET /api/gamification/summary/weekly`
- `GET /api/gamification/missions/weekly`
- `GET /api/gamification/streak`
- `GET /api/gamification/rewards`
- `GET /api/gamification/metrics/summary`
- `GET /ops/health`
- `GET /ops/metrics`

## Ejecucion 1 - Spike

Comando ejecutado:

```bash
npm run load:spike -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --warmupSec 8 --spikeSec 18 --recoverySec 8 --spikePeakConcurrency 40
```

Resultado:

- Requests: 1713
- Throughput: 46.30 rps
- Error rate: 0.00%
- Timeouts: 0
- Latencia avg: 506.31 ms
- Latencia p95: 1791 ms
- Latencia p99: 2424 ms

Snapshot /ops/metrics (post-run):

- `traffic.errorRate`: 0
- `traffic.latencyMs.p95`: 1268

## Ejecucion 2 - Soak (corto)

Comando ejecutado:

```bash
npm run load:soak -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --soakConcurrency 16 --soakSec 75
```

Resultado:

- Requests: 3192
- Throughput: 42.00 rps
- Error rate: 0.00%
- Timeouts: 0
- Latencia avg: 375.96 ms
- Latencia p95: 1039 ms
- Latencia p99: 1422 ms

Snapshot /ops/metrics (post-run):

- `traffic.errorRate`: 0
- `traffic.latencyMs.p95`: 1013

## Observaciones tecnicas

1. Las rutas de lectura cacheadas (`summary/weekly`) mantuvieron latencia baja y estable.
2. `missions/weekly` y `metrics/summary` concentran mayor latencia relativa bajo carga.
3. No se observaron 5xx ni timeouts en los escenarios ejecutados.

## Riesgos residuales

1. Esta evidencia es local; falta contraste en entorno de staging con condiciones de red y recursos mas realistas.
2. Aun no se incluyeron escenarios write-heavy continuos (progress/claim) por requerir ids de misiones/recompensas controlados para no sesgar por errores de negocio.

## Revalidacion post-SQL (2026-03-30)

Contexto:

- Se aplicaron en Supabase, sin errores, las migraciones:
   - `migrations_phase7_1_performance.sql`
   - `migrations_phase7_2_levels_indexes.sql`

Ejecucion soak post-migracion:

```bash
npm run load:soak -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --soakConcurrency 16 --soakSec 60
```

Resultado:

- Requests: 2295
- Throughput: 37.62 rps
- Error rate runner: 1.00% (23 timeouts)
- Latencia avg: 420.08 ms
- Latencia p95: 1201 ms
- Latencia p99: 5002 ms

Snapshot `/ops/metrics` post-run:

- `traffic.errorRate`: 0.0004
- `traffic.latencyMs.p95`: 1213

Lectura:

1. El path de lectura sigue estable sin 5xx en rutas de gamificacion.
2. Persiste cola de latencia en `missions/weekly` y `metrics/summary` bajo carga sostenida.

## Proximo paso recomendado (S74-003)

1. Calibrar umbrales de alerta con base en estos p95/p99 iniciales:
   - mantener alerta p95 global >= 1200 ms (warning) y >= 1600 ms (critical) en stress intermedio.
   - mantener alerta error rate >= 3% (warning) y >= 5% (critical).
2. Repetir suite en staging y comparar against local baseline.
