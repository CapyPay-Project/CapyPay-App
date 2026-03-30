# Fase 7.4 - Reporte write-heavy (progress/claim)

Fecha: 2026-03-30
Estado: COMPLETADO (validacion ejecutada)

## Objetivo

Validar rutas mutantes de gamificacion con carga write-heavy:

1. `POST /api/gamification/missions/:id/progress`
2. `POST /api/gamification/missions/:id/claim`
3. `POST /api/gamification/rewards/:id/claim`

## Preparacion tecnica

Se extendio la suite de carga en backend:

- Script: `capypay-backend/scripts/load/gamification-load-suite.mjs`
- Nuevo modo: `--mode write`
- Script npm: `npm run load:write`

Caracteristicas del modo write-heavy:

- Descubrimiento dinamico de IDs desde `missions/weekly` y `rewards`.
- Mezcla ponderada de progress/claim para estresar rutas de escritura reales.
- Snapshot operativo final via `/ops/metrics`.

## Ejecucion A (agresiva)

Comando:

```bash
npm run load:write -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --writeConcurrency 12 --writeSec 30
```

Resultado:

- Requests: 519
- Throughput: 15.26 rps
- Error rate: 76.30%
- Timeouts: 0
- Latencia avg: 675.24 ms
- Latencia p95: 1124 ms

Estado observado:

- Errores concentrados en `429` (rate-limit/risk protection), sin cascada de `5xx`.

## Ejecucion B (calibrada)

Se aplico override temporal `allow` para reducir sesgo por bloqueo de riesgo y repetir medicion en menor concurrencia.

Comandos:

```bash
POST /api/gamification/risk/review/:userId/override { action: "allow", durationMin: 45 }
npm run load:write -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --writeConcurrency 4 --writeSec 45
```

Resultado:

- Requests: 237
- Throughput: 4.84 rps
- Error rate: 67.93%
- Timeouts: 0
- Latencia avg: 738.27 ms
- Latencia p95: 1938 ms

Estado observado:

- Persisten `429` como estado dominante en endpoints write-heavy.
- No se observaron `5xx` durante el escenario.

## Lectura tecnica

1. La validacion write-heavy pendiente quedo ejecutada con evidencia reproducible.
2. Los objetivos estrictos de p95/error-rate para writes no se cumplen aun.
3. El comportamiento actual prioriza proteccion anti-abuso/capacidad (429) sobre throughput de escritura.

## Decision para continuidad

Este resultado habilita apertura de Fase 7.x enfocada en write-path:

1. Ajustar limites adaptativos por endpoint/segmento para reducir 429 no deseado en carga legitima.
2. Correr benchmark write-heavy en staging con perfiles de usuario menos penalizados por riesgo acumulado.
3. Revalidar KPIs 3 y 4 con ventana limpia de riesgo y dataset controlado.

## Revalidacion post-SQL (2026-03-30)

Contexto:

- Migraciones SQL aplicadas en Supabase sin errores:
	- `migrations_phase7_1_performance.sql`
	- `migrations_phase7_2_levels_indexes.sql`

Ejecucion controlada post-migracion:

```bash
npm run load:write -- --userId 171ef998-bfa8-4f26-bac4-a2960ec51d22 --writeConcurrency 1 --writeSec 45
```

Resultado:

- Requests: 43
- Throughput: 0.84 rps
- Error rate: 48.84%
- Timeouts: 1
- Latencia avg: 818.81 ms
- Latencia p95: 851 ms

Estado observado:

- Error dominante sigue siendo `429` (20 casos), asociado a proteccion de riesgo/capacidad.
- No se evidencian 5xx en el resumen del endpoint ops.

Lectura post-SQL:

1. La optimizacion de indices no elimina por si sola el principal limitante write-heavy, que es la politica de proteccion (429).
2. Para cerrar KPIs de progress/claim se requiere tuning de anti-abuso/rate-limit con perfilado en staging.