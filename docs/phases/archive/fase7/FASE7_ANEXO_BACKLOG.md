# Fase 7 - Backlog operativo (optimización integral)

> Documento maestro vigente de la fase: `FASE7.md`.
> Este archivo se mantiene como anexo historico.

Backlog listo para ejecución inmediata de mejoras de rendimiento, robustez y anti-saturación.

## Convención de IDs

- Formato: F7-S{sprint}-{correlativo}
- Ejemplo: F7-S71-001

Estados sugeridos:

- TODO
- IN_PROGRESS
- BLOCKED
- IN_REVIEW
- DONE

Prioridades:

- P0: impacto crítico en latencia/estabilidad
- P1: alto impacto en eficiencia y UX
- P2: mejora evolutiva

Estimación sugerida:

- S: <= 1 día
- M: 2-3 días
- L: 4-5 días

---

## Sprint 7.1 - DB y agregados

### Objetivo sprint

Bajar costo de consulta y latencia en rutas de gamificación mediante tuning estructural de DB.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F7-S71-001 | Auditar queries críticas con EXPLAIN ANALYZE | P0 | M | Ninguna | Baseline de planes y costos | DONE |
| F7-S71-002 | Crear índices compuestos en tablas de gamificación | P0 | L | F7-S71-001 | Migraciones SQL de índices | DONE |
| F7-S71-003 | Implementar tabla de KPIs diarios agregados | P0 | L | F7-S71-001 | Esquema de agregados por segmento/variante | DONE |
| F7-S71-004 | Job incremental de consolidación de métricas | P1 | M | F7-S71-003 | Pipeline batch incremental | DONE |
| F7-S71-005 | Adaptar summary para leer agregados históricos | P0 | M | F7-S71-003, F7-S71-004 | Endpoint summary optimizado | DONE |
| F7-S71-006 | Reporte comparativo de latencia y costo DB | P1 | S | F7-S71-005 | Evidencia before/after | DONE |
| F7-S71-007 | Completar reporte baseline DB S7.1 | P1 | S | F7-S71-001, F7-S71-006 | FASE7_ANEXO_S71_BASELINE_DB.md llenado | DONE |

Checklist de cierre Sprint 7.1:

- [x] Consultas críticas sin full-scan no controlado.
- [x] Agregados diarios alimentados y consistentes.
- [x] p95 de endpoints de lectura mejora medible.

---

## Sprint 7.2 - Backend y anti-saturación

### Objetivo sprint

Elevar eficiencia de servicio e impedir degradaciones en cascada durante picos.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F7-S72-001 | Cachear config pública de gamificación | P0 | M | F7-S71-002 | Cache + invalidación por cambio de config | DONE |
| F7-S72-002 | Cachear resumen semanal por usuario | P0 | L | F7-S71-005 | Cache + invalidación por eventos de claim/progress | DONE |
| F7-S72-003 | Implementar presupuesto de concurrencia por ruta | P0 | M | Ninguna | Límite de concurrencia en rutas críticas | DONE |
| F7-S72-004 | Extender rate-limit adaptativo con señal de capacidad | P1 | M | F7-S72-003 | Limitador riesgo+capacidad | DONE |
| F7-S72-005 | Circuit breaker y fallback en dependencias lentas | P1 | M | Ninguna | Respuesta degradada controlada | DONE |
| F7-S72-006 | Runbook operativo de saturación | P1 | S | F7-S72-004, F7-S72-005 | Guía de respuesta a incidentes de capacidad | DONE |

Checklist de cierre Sprint 7.2:

- [x] Cache hit-rate de rutas elegibles >= 75%.
- [x] Sin cascadas de timeout ante picos controlados.
- [x] Error rate estable durante pruebas de estrés intermedio.

Evidencia rápida (2026-03-30, prueba intermedia local):

- Carga: 180 requests por endpoint con concurrencia 24 en `/api/gamification/summary/weekly` y `/api/gamification/metrics/summary`.
- Resultado global: 360/360 OK, error rate 0%, timeouts 0.
- Throughput global: 70.22 rps.
- Observabilidad `/ops/metrics` post-prueba: `traffic.errorRate=0`, `traffic.latencyMs.p95=1436`.

Evidencia de cache hit-rate (2026-03-30):

- Endpoint medido: `/api/gamification/summary/weekly?userId=171ef998-bfa8-4f26-bac4-a2960ec51d22`.
- Muestra válida: 30 requests secuenciales, 30/30 con `cache.hit=true`.
- Hit-rate observado: 100% (objetivo >= 75% cumplido).

---

## Sprint 7.3 - Frontend eficiente

### Objetivo sprint

Reducir costo de red y mejorar percepción de velocidad en módulos de niveles.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F7-S73-001 | Deduplicar requests de gamificación en cliente | P0 | M | F7-S72-001, F7-S72-002 | Capa cliente sin llamadas redundantes | DONE |
| F7-S73-002 | SWR para dashboard/niveles/notificaciones | P1 | M | F7-S73-001 | Flujo de lectura rápida + revalidación | DONE |
| F7-S73-003 | Prefetch inteligente Dashboard -> Niveles | P1 | S | F7-S73-001 | Navegación con menor latencia percibida | DONE |
| F7-S73-004 | Ajuste de skeletons y estados de degradación | P1 | M | Ninguna | UX resiliente en red lenta | DONE |
| F7-S73-005 | Instrumentar web-vitals en vistas de gamificación | P1 | M | Ninguna | Métricas de UX técnico | DONE |
| F7-S73-006 | Reporte de latencia percibida before/after | P2 | S | F7-S73-005 | Evidencia de mejora UX | DONE |

Evidencia técnica Sprint 7.3 (2026-03-30):

- Implementación en cliente: deduplicación de requests en vuelo + cache SWR para `weekly_missions`, `weekly_summary`, `streak`, `public_config` y `metrics_summary`.
- Invalidación selectiva de cache cliente tras mutaciones (`progressMission`, `claimMission`, `claimReward`).
- Prefetch por intención de navegación (hover/focus/touch) en enlace Dashboard -> Niveles para calentar `weeklySummary`, `weeklyMissions` y recompensas pendientes.
- Estados degradados/skeletons reforzados en `account/niveles` y `account/notifications` con reintentos explícitos y estado operacional visible en UI.
- Web-vitals instrumentados en `dashboard`, `account/niveles` y `account/notifications` con evento `capypay-web-vitals` y logging local para benchmark before/after.
- Build validado en verde: `npm --prefix ..\\CapyPay-App run build`.
- Reporte de latencia percibida completado: `FASE7_ANEXO_S73_LATENCIA_PERCIBIDA.md`.

Checklist de cierre Sprint 7.3:

- [ ] Menor número de requests repetidas por sesión.
- [ ] Mejora medible de render percibido en vistas críticas.
- [ ] Comportamiento consistente con reintentos y red lenta.

---

## Sprint 7.4 - Carga y cierre

### Objetivo sprint

Validar robustez end-to-end y cerrar con decisión basada en evidencia de capacidad.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F7-S74-001 | Diseñar suite de pruebas de carga (spike/soak) | P0 | M | F7-S72-003 | Escenarios reproducibles | DONE |
| F7-S74-002 | Ejecutar carga sobre rutas críticas de gamificación | P0 | M | F7-S74-001 | Resultados de capacidad | DONE |
| F7-S74-003 | Ajustar umbrales y alertas operativas | P1 | S | F7-S74-002 | Alertas calibradas por capacidad real | DONE |
| F7-S74-004 | Validar rollback/fallback de optimizaciones | P0 | S | F7-S72-005 | Plan de reversión probado | DONE |
| F7-S74-005 | Consolidar informe final de Fase 7 | P0 | S | F7-S74-002, F7-S74-003, F7-S74-004 | FASE7_ANEXO_RESULTADOS.md | DONE |

Evidencia Sprint 7.4 (2026-03-30):

- Suite reproducible creada en `capypay-backend/scripts/load/gamification-load-suite.mjs` con comandos `load:spike`, `load:soak` y `load:write`.
- Spike inicial (40 conc, 34s efectivo): 1713 req, 46.30 rps, error rate 0.00%, p95 1791 ms.
- Soak inicial (16 conc, 75s): 3192 req, 42.00 rps, error rate 0.00%, p95 1039 ms.
- Reporte consolidado + revalidacion post-SQL: `FASE7_ANEXO_S74_CARGA_INICIAL.md`.
- Write-heavy sobre progress/claim ejecutado en dos perfiles (agresivo y calibrado) con 429 dominante y sin 5xx: `FASE7_ANEXO_S74_WRITE_HEAVY.md`.
- Alertas calibradas en observability con severidades warning/critical: `FASE7_ANEXO_S74_CALIBRACION_ALERTAS.md`.
- Rollback/fallback validado con drill controlado (fallback por timeout + recovery post-cooldown + spike de estabilidad): `FASE7_ANEXO_S74_ROLLBACK_FALLBACK.md`.
- Informe final de fase consolidado: `FASE7_ANEXO_RESULTADOS.md`.

Checklist de cierre Sprint 7.4:

- [x] Pruebas de carga completas con evidencia.
- [ ] Objetivos p95 y error rate dentro de umbral.
- [x] Informe final de cierre publicado.

---

## Reglas operativas del tablero

1. Ningún ticket P0 pasa a DONE sin benchmark comparativo.
2. Todo cambio de cache debe documentar estrategia de invalidación.
3. Todo cambio DB debe incluir evidencia de plan de ejecución.
4. Todo ajuste anti-saturación debe tener fallback y rollback.

## Plantilla mínima para cada issue

```text
ID: F7-Sxx-xxx
Titulo:
Objetivo:
Alcance:
Fuera de alcance:
Criterios de aceptacion:
Pruebas requeridas:
Riesgos:
Dependencias:
Evidencia de cierre:
```
