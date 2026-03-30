# Fase 7.1 - Reporte baseline DB y latencia

Plantilla de evidencia para cerrar:

- F7-S71-001 (EXPLAIN ANALYZE baseline)
- F7-S71-006 (comparativo before/after)

## Estado

- Migracion de rendimiento: implementada.
- Job incremental de agregados: implementado.
- Adaptacion de summary a agregados: implementado.
- Evidencia SQL real en Supabase: pendiente de ejecución.

## Archivos de referencia

- SQL migracion Sprint 7.1: `capypay-backend/docs/migrations_phase7_1_performance.sql`
- SQL benchmark EXPLAIN: `capypay-backend/docs/phase7_1_explain_analyze.sql`

## Baseline (antes de aplicar migración)

Fecha de ejecución:

Entorno:

### Query 1 - events 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 2 - weekly missions 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 3 - reward claims 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 4 - notifications weekly user/type

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 5 - daily kpis 7d

- N/A (tabla no disponible antes)

## Post-migración (después de aplicar migración)

Fecha de ejecución:

Entorno:

### Query 1 - events 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 2 - weekly missions 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 3 - reward claims 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 4 - notifications weekly user/type

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

### Query 5 - daily kpis 7d

- Plan resumen:
- Tiempo total (ms):
- Tipo de scan:
- Buffers:

## Comparativo before/after

| Query | Before ms | After ms | Mejora % | Observación |
| --- | ---: | ---: | ---: | --- |
| events 7d |  |  |  |  |
| weekly missions 7d |  |  |  |  |
| reward claims 7d |  |  |  |  |
| notifications weekly |  |  |  |  |
| daily kpis 7d | N/A |  | N/A |  |

## Evidencia API (latencia endpoint)

### Endpoint `/api/gamification/metrics/summary`

- Before p95 (ms):
- After p95 (ms):
- Fuente devuelta (`source`):

### Endpoint `/api/gamification/summary/weekly`

- Before p95 (ms):
- After p95 (ms):

## Conclusión Sprint 7.1

- [ ] F7-S71-001 listo para DONE.
- [ ] F7-S71-006 listo para DONE.
- [ ] Riesgos residuales documentados.

Observaciones:
