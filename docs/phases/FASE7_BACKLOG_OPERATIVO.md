# Fase 7 - Backlog operativo (optimización integral)

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
| F7-S71-001 | Auditar queries críticas con EXPLAIN ANALYZE | P0 | M | Ninguna | Baseline de planes y costos | TODO |
| F7-S71-002 | Crear índices compuestos en tablas de gamificación | P0 | L | F7-S71-001 | Migraciones SQL de índices | TODO |
| F7-S71-003 | Implementar tabla de KPIs diarios agregados | P0 | L | F7-S71-001 | Esquema de agregados por segmento/variante | TODO |
| F7-S71-004 | Job incremental de consolidación de métricas | P1 | M | F7-S71-003 | Pipeline batch incremental | TODO |
| F7-S71-005 | Adaptar summary para leer agregados históricos | P0 | M | F7-S71-003, F7-S71-004 | Endpoint summary optimizado | TODO |
| F7-S71-006 | Reporte comparativo de latencia y costo DB | P1 | S | F7-S71-005 | Evidencia before/after | TODO |

Checklist de cierre Sprint 7.1:

- [ ] Consultas críticas sin full-scan no controlado.
- [ ] Agregados diarios alimentados y consistentes.
- [ ] p95 de endpoints de lectura mejora medible.

---

## Sprint 7.2 - Backend y anti-saturación

### Objetivo sprint

Elevar eficiencia de servicio e impedir degradaciones en cascada durante picos.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F7-S72-001 | Cachear config pública de gamificación | P0 | M | F7-S71-002 | Cache + invalidación por cambio de config | TODO |
| F7-S72-002 | Cachear resumen semanal por usuario | P0 | L | F7-S71-005 | Cache + invalidación por eventos de claim/progress | TODO |
| F7-S72-003 | Implementar presupuesto de concurrencia por ruta | P0 | M | Ninguna | Límite de concurrencia en rutas críticas | TODO |
| F7-S72-004 | Extender rate-limit adaptativo con señal de capacidad | P1 | M | F7-S72-003 | Limitador riesgo+capacidad | TODO |
| F7-S72-005 | Circuit breaker y fallback en dependencias lentas | P1 | M | Ninguna | Respuesta degradada controlada | TODO |
| F7-S72-006 | Runbook operativo de saturación | P1 | S | F7-S72-004, F7-S72-005 | Guía de respuesta a incidentes de capacidad | TODO |

Checklist de cierre Sprint 7.2:

- [ ] Cache hit-rate de rutas elegibles >= 75%.
- [ ] Sin cascadas de timeout ante picos controlados.
- [ ] Error rate estable durante pruebas de estrés intermedio.

---

## Sprint 7.3 - Frontend eficiente

### Objetivo sprint

Reducir costo de red y mejorar percepción de velocidad en módulos de niveles.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F7-S73-001 | Deduplicar requests de gamificación en cliente | P0 | M | F7-S72-001, F7-S72-002 | Capa cliente sin llamadas redundantes | TODO |
| F7-S73-002 | SWR para dashboard/niveles/notificaciones | P1 | M | F7-S73-001 | Flujo de lectura rápida + revalidación | TODO |
| F7-S73-003 | Prefetch inteligente Dashboard -> Niveles | P1 | S | F7-S73-001 | Navegación con menor latencia percibida | TODO |
| F7-S73-004 | Ajuste de skeletons y estados de degradación | P1 | M | Ninguna | UX resiliente en red lenta | TODO |
| F7-S73-005 | Instrumentar web-vitals en vistas de gamificación | P1 | M | Ninguna | Métricas de UX técnico | TODO |
| F7-S73-006 | Reporte de latencia percibida before/after | P2 | S | F7-S73-005 | Evidencia de mejora UX | TODO |

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
| F7-S74-001 | Diseñar suite de pruebas de carga (spike/soak) | P0 | M | F7-S72-003 | Escenarios reproducibles | TODO |
| F7-S74-002 | Ejecutar carga sobre rutas críticas de gamificación | P0 | M | F7-S74-001 | Resultados de capacidad | TODO |
| F7-S74-003 | Ajustar umbrales y alertas operativas | P1 | S | F7-S74-002 | Alertas calibradas por capacidad real | TODO |
| F7-S74-004 | Validar rollback/fallback de optimizaciones | P0 | S | F7-S72-005 | Plan de reversión probado | TODO |
| F7-S74-005 | Consolidar informe final de Fase 7 | P0 | S | F7-S74-002, F7-S74-003, F7-S74-004 | FASE7_RESULTADOS_Y_DECISION.md | TODO |

Checklist de cierre Sprint 7.4:

- [ ] Pruebas de carga completas con evidencia.
- [ ] Objetivos p95 y error rate dentro de umbral.
- [ ] Informe final de cierre publicado.

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
