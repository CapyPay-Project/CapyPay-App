# Fase 7 - Niveles 3.0 (Plan ejecutable de optimización)

## Objetivo

Optimizar integralmente el sistema de niveles (frontend, backend y base de datos) para operar con baja latencia, alta estabilidad y resistencia a picos de carga sin degradar la UX ni la trazabilidad operativa.

## Resultado esperado de la fase

- Sistema de niveles más rápido en rutas críticas de progreso, claim y resumen semanal.
- Menor costo de consulta y menor presión sobre tablas de eventos crudos.
- Menor riesgo de saturación en escenarios de concurrencia alta.
- Operación más predecible con alertas de capacidad y runbooks de respuesta.

## KPIs objetivo (contra baseline de cierre Fase 6)

1. p95 de `/api/gamification/missions/weekly`: <= 220 ms.
2. p95 de `/api/gamification/summary/weekly`: <= 260 ms.
3. p95 de `POST /api/gamification/missions/:id/progress`: <= 250 ms.
4. p95 de `POST /api/gamification/rewards/:id/claim`: <= 300 ms.
5. Error rate en `/api/gamification/*`: <= 1.2% sostenido.
6. Timeouts de DB en rutas de gamificación: 0 en operación normal.
7. Cache hit-rate en lecturas de resumen/config: >= 75%.
8. Reducción de consultas full-scan sobre `gamification_events`: >= 80%.

## Criterios de entrada

- Fase 6 cerrada y validada (tests/build/smoke en verde).
- Documento canónico vigente: `docs/product/SISTEMA_NIVELES_ACTUAL.md`.
- Observabilidad de `/ops` operativa.
- Backlog de Fase 7 priorizado por impacto y riesgo.

## Estructura de ejecución

Duración sugerida: 4 sprints (2 semanas por sprint).

- Sprint 7.1: Rendimiento de datos y consultas (DB-first).
- Sprint 7.2: Capa de servicio y control de saturación (backend-first).
- Sprint 7.3: Optimización UX y consumo eficiente (frontend-first).
- Sprint 7.4: Hardening de carga, resiliencia y cierre de fase.

Estado actual de ejecución:

- Sprint 7.1: planificado.
- Sprint 7.2: planificado.
- Sprint 7.3: planificado.
- Sprint 7.4: planificado.

Backlog operativo del plan:

- `FASE7_BACKLOG_OPERATIVO.md`

---

## Sprint 7.1 - Rendimiento DB y pre-agregados

### Objetivo

Reducir latencia y costo de lectura de métricas/resúmenes sin depender de scans pesados sobre eventos crudos.

### Tareas técnicas

- Definir y crear índices compuestos para rutas de lectura/escritura de gamificación.
- Crear tabla/materialización de KPIs diarios por segmento/variante.
- Implementar job de agregación incremental (por ventana temporal).
- Actualizar consultas de summary para priorizar datos agregados.
- Medir y documentar `EXPLAIN ANALYZE` de consultas críticas.

### Criterios de aceptación

- [ ] Las consultas críticas usan índices esperados y no full-scan no controlado.
- [ ] `summary/weekly` consume agregados para métricas históricas.
- [ ] Se reduce al menos 80% la lectura directa de `gamification_events` para KPI histórico.

### Entregables

- Migraciones SQL de índices y tablas de agregados.
- Documento de tuning DB para gamificación.
- Métricas comparativas before/after por endpoint crítico.

---

## Sprint 7.2 - Backend de alta eficiencia y anti-saturación

### Objetivo

Fortalecer la capa de servicio para responder rápido bajo carga y degradar de forma controlada ante picos.

### Tareas técnicas

- Añadir cache por clave para config pública y resumen semanal.
- Implementar invalidación selectiva por eventos relevantes (claim/progress/config change).
- Definir protección por budget de concurrencia en rutas sensibles.
- Mejorar rate limiting adaptativo combinando riesgo + capacidad actual.
- Incorporar circuit breaker/fallback para dependencias lentas.

### Criterios de aceptación

- [ ] Cache hit-rate >= 75% en endpoints elegibles.
- [ ] Bajo carga, el sistema evita cascadas de timeout.
- [ ] El throughput se mantiene estable sin crecimiento abrupto de errores 5xx.

### Entregables

- Módulo de cache + invalidación.
- Políticas anti-saturación documentadas.
- Runbook operativo de degradación controlada.

---

## Sprint 7.3 - Frontend eficiente y UX resiliente

### Objetivo

Reducir consumo redundante y tiempo percibido de carga en dashboard/niveles/notificaciones.

### Tareas técnicas

- Consolidar requests repetidas de gamificación en capa cliente (deduplicación).
- Aplicar estrategia SWR para widgets de niveles/resumen semanal.
- Introducir prefetch inteligente para navegación Dashboard -> Niveles.
- Mejorar skeletons y estados intermedios para ocultar jitter de red.
- Instrumentar métricas de web-vitals y tiempo de hidratación en vistas críticas.

### Criterios de aceptación

- [ ] Menos llamadas duplicadas en navegación y refrescos UI.
- [ ] Tiempo percibido de render en módulos críticos mejora de forma medible.
- [ ] UX mantiene consistencia en red lenta y reintentos.

### Entregables

- Refactor de consumo API gamificación en frontend.
- Reporte de web-vitals/base de latencia percibida.
- Guía UX de degradación elegante en módulos de niveles.

---

## Sprint 7.4 - Hardening de carga y cierre

### Objetivo

Validar robustez final con pruebas de carga, cierre de riesgos y plan de continuidad.

### Tareas técnicas

- Diseñar escenarios de carga realistas para rutas de gamificación.
- Ejecutar pruebas de stress/spike/soak y registrar resultados.
- Ajustar umbrales de alertas de capacidad (CPU, memoria, latencia, error rate).
- Validar rollback/fallback de componentes de optimización.
- Publicar informe final de Fase 7 con decisión operativa.

### Criterios de aceptación

- [ ] Pruebas de carga completadas con evidencia y umbrales definidos.
- [ ] Sistema estable ante picos sin degradación crítica de UX.
- [ ] Informe final con decisión de continuidad publicado.

### Entregables

- Paquete de pruebas de carga y resultados.
- Ajuste final de alertas operativas.
- Documento: `FASE7_RESULTADOS_Y_DECISION.md`.

---

## Dependencias clave

1. Ajustes DB (índices/agregados) antes de tuning backend final.
2. Invalidación de cache alineada con eventos de negocio.
3. Instrumentación frontend coordinada con métricas backend.

## Riesgos y mitigación

1. Riesgo: inconsistencia entre cache y estado real.
   Mitigación: invalidación selectiva + TTL corto + fallback a fuente autoritativa.
2. Riesgo: sobre-optimización de queries con regresión funcional.
   Mitigación: suite de pruebas + comparación de resultados before/after.
3. Riesgo: saturación por eventos de pico.
   Mitigación: concurrency budget + rate limit adaptativo + circuit breaker.
4. Riesgo: degradación UX por estrategias de carga.
   Mitigación: SWR + skeletons + seguimiento de web-vitals.

## Plan de pruebas por sprint

- Unitarias backend para caché, invalidación, agregados y control de concurrencia.
- Integración API para endpoints críticos de gamificación.
- Pruebas SQL con validación de planes de ejecución.
- Smoke E2E y pruebas de UX bajo red limitada.
- Pruebas de carga en Sprint 7.4.

## Definición de terminado (DoD) por sprint

- [ ] KPIs técnicos del sprint medidos y reportados.
- [ ] Tests relevantes en verde.
- [ ] Documentación actualizada (fase/producto/operación).
- [ ] Riesgos de saturación del sprint mitigados o con plan explícito.

## Criterio de cierre de Fase 7

- p95 y error rate de rutas críticas dentro de objetivo.
- Evidencia de estabilidad bajo carga y picos.
- Coste de consulta reducido con agregados efectivos.
- Decisión final documentada: escalar, consolidar o abrir Fase 7.x.
