# Fase 6 - Niveles 2.0 (Plan ejecutable)

> Documento maestro vigente de la fase: `FASE6.md`.
> Este archivo se mantiene como anexo historico.

## Objetivo

Escalar el sistema de niveles de un estado funcional a un estado optimizado para retencion, balance economico y control de abuso.

## Resultado esperado de la fase

- Mejor retencion en usuarios activos de gamificacion.
- Mejor conversion de progreso a claim de recompensas.
- Menor riesgo de abuso por automatizacion o uso anomalo.
- Motor de reglas mas configurable sin cambios frecuentes de codigo.

## KPIs objetivo (contra baseline de Fase 5)

1. Retencion D7 en usuarios que interactuan con niveles: +10% a +15%.
2. Usuarios que completan al menos 1 mision semanal: +20%.
3. Ratio de claim sobre recompensas disponibles: +15%.
4. Incidentes de abuso confirmados en claims: < 1%.
5. Error rate en endpoints /api/gamification/*: < 2%.

## Criterios de entrada

- Backend y frontend en verde (build/test/smoke).
- Observabilidad operativa activa (/ops/health, /ops/metrics).
- Baseline de metricas de fase previa documentado.

## Estructura de ejecucion

Duracion sugerida: 4 sprints (2 semanas por sprint).

- Sprint 6.1: Balance y progresion.
- Sprint 6.2: Misiones por segmentos.
- Sprint 6.3: Anti-abuso y resiliencia.
- Sprint 6.4: Experimentacion UX y optimizacion final.

Estado actual de ejecucion:

- Sprint 6.1: completado.
- Sprint 6.2: completado.
- Sprint 6.3: completado (anti-abuso backend + runbook operativo).
- Sprint 6.4: completado (A/B instrumentado + resumen semanal UX + regresion completa).

Backlog operativo del plan (IDs de ejecucion):

- FASE6_ANEXO_BACKLOG.md

Documento unificado vigente del sistema:

- ../product/SISTEMA_NIVELES_ACTUAL.md

Evolucion propuesta posterior (Fase 7):

- FASE7_ANEXO_PLAN_EJECUTABLE.md
- FASE7_ANEXO_BACKLOG.md

---

## Sprint 6.1 - Balance y progresion

### Objetivo

Definir una curva de progreso sostenible (XP -> nivel -> recompensa) y evitar inflacion de valor.

### Historias (backlog ejecutable)

1. Como equipo de producto, queremos versionar la curva de XP por nivel para ajustar dificultad sin redeploy.
2. Como equipo tecnico, queremos centralizar reglas de recompensa en config para reducir hardcode.
3. Como negocio, queremos evitar inflacion de XP/recompensas para proteger sostenibilidad.

### Tareas tecnicas

- Crear tabla/config de balance versionado (niveles, XP por nivel, pesos por mision, caps diarios/semanales).
- Exponer endpoint publico de config efectiva de niveles para frontend.
- Ajustar calculos de progreso y claims para usar config versionada.
- Agregar tests unitarios de regresion para transiciones de nivel y caps.
- Documentar regla de migracion si cambia la curva en usuarios existentes.

### Criterios de aceptacion

- [x] Se puede cambiar la curva de niveles sin modificar codigo.
- [x] Los tests de progresion cubren casos limite (limite exacto, sobrepaso, rollback).
- [x] No hay regresion en claim de mision/recompensa existente.
- [x] Se publica documento de balance v1 en docs/product.

### Entregables

- Config de balance versionada implementada.
- Tests de progresion en backend.
- Documento: BALANCE_NIVELES_V1.md (en docs/product/).

---

## Sprint 6.2 - Misiones por segmentos

### Objetivo

Personalizar misiones segun tipo de usuario para mejorar engagement y progresion real.

### Historias (backlog ejecutable)

1. Como usuario nuevo, quiero misiones simples para activar habito rapido.
2. Como usuario recurrente, quiero misiones relevantes a mis servicios mas usados.
3. Como equipo, queremos medir rendimiento por segmento para iterar reglas.

### Tareas tecnicas

- Definir segmentos iniciales (nuevo, recurrente, power-user).
- Implementar asignador de misiones por segmento con fallback.
- Persistir segmento y version de reglas aplicadas por usuario.
- Agregar metricas por segmento en resumen de gamificacion.
- Actualizar frontend (dashboard/niveles) para mostrar contexto de mision cuando aplique.

### Criterios de aceptacion

- [x] Cada usuario recibe set de misiones valido para su segmento.
- [x] Existe fallback seguro cuando faltan datos de segmentacion.
- [x] Metricas por segmento visibles en /api/gamification/metrics/summary.
- [x] Smoke E2E de misiones sigue en verde.

### Entregables

- Asignador de misiones por segmentos.
- Indicadores por segmento en metricas.
- Nota de producto: SEGMENTACION_MISIONES_V1.md.

---

## Sprint 6.3 - Anti-abuso y resiliencia

### Objetivo

Reducir fraude y ruido operativo en claims/progreso sin deteriorar UX legitima.

### Historias (backlog ejecutable)

1. Como equipo de plataforma, queremos detectar patrones anomalos para bloquear abuso temprano.
2. Como operacion, queremos alertas accionables cuando suba riesgo de fraude.
3. Como usuario legitimo, quiero que los bloqueos falsos sean minimos y recuperables.

### Tareas tecnicas

- Agregar score simple de riesgo por usuario (frecuencia, repeticion, picos inusuales).
- Aplicar rate-limit adaptativo en rutas de progress/claim.
- Log de eventos de riesgo para auditoria.
- Alertas operativas cuando se superen umbrales de riesgo/fallo.
- Ruta interna de revision manual para desbloqueo (operativa).

### Criterios de aceptacion

- [x] Claims anormales quedan limitados o bloqueados de forma consistente.
- [x] Se registran eventos de riesgo con contexto minimo util.
- [x] Alertas no generan spam (cooldown correcto).
- [x] No sube error rate funcional por encima de objetivos de fase.

### Entregables

- Modulo de riesgo v1.
- Politica de umbrales documentada.
- Runbook anti-abuso en docs/pilot o docs/qa.

---

## Sprint 6.4 - Experimentacion UX y cierre

### Objetivo

Optimizar engagement con experimentos controlados y cerrar fase con evidencia.

### Historias (backlog ejecutable)

1. Como producto, quiero probar variantes de recompensas y copy para mejorar conversion a claim.
2. Como usuario, quiero ver progreso claro y siguiente objetivo semanal.
3. Como equipo, queremos una decision de cierre con datos y no por intuicion.

### Tareas tecnicas

- Definir 1-2 experimentos A/B (copy, recompensa, orden visual).
- Implementar asignacion de variante y tracking de conversion.
- Agregar resumen semanal de avance en UI de niveles/notificaciones.
- Correr regresion completa (build, test backend, smoke E2E).
- Consolidar informe final de fase con KPIs y decision.

### Criterios de aceptacion

- [x] Experimentos tienen hipotesis, metrica y criterio de exito definidos.
- [x] Se registra conversion por variante de forma trazable.
- [x] UX de progreso semanal es clara y sin spam de notificaciones.
- [x] Informe final de Fase 6 publicado.

### Entregables

- Experimentos A/B v1 instrumentados.
- Resumen semanal en UI.
- Documento: FASE6_ANEXO_RESULTADOS.md.

---

## Dependencias entre sprints

1. Sprint 6.2 depende de reglas/config de Sprint 6.1.
2. Sprint 6.3 depende de metricas y eventos consolidados en 6.1-6.2.
3. Sprint 6.4 depende de tracking estable y riesgo controlado.

## Riesgos principales y mitigacion

1. Riesgo: complejidad excesiva de reglas.
   Mitigacion: versionado simple + flags por entorno + fallback.
2. Riesgo: falsos positivos en anti-abuso.
   Mitigacion: umbrales conservadores + modo observacion inicial.
3. Riesgo: experimentos sin significancia.
   Mitigacion: definir muestra minima y ventana temporal antes de concluir.
4. Riesgo: sobrecarga UX por gamificacion.
   Mitigacion: notificaciones consolidadas y copy accionable.

## Plan de pruebas por sprint

- Unitarias backend: progresion, claim, segmentacion, anti-abuso.
- Integracion API: rutas /api/gamification/* + errores de borde.
- Smoke E2E frontend: login -> dashboard -> misiones -> claim -> notificaciones.
- Validacion manual UX: dashboard mobile, niveles, bandeja de notificaciones.

## Definicion de terminado (DoD) por sprint

- [x] Historias con criterios de aceptacion cumplidos.
- [x] Tests relevantes en verde.
- [x] Documentacion actualizada (README/docs fase/producto).
- [x] Sin regresiones criticas en flujos base.

## Criterio de cierre de Fase 6

- KPIs de fase evaluados contra baseline.
- Minimo 2 KPI clave mejoran de forma sostenida.
- Sin incremento material de incidentes operativos.
- Decision final documentada: continuar escalando o iterar una subfase 6.x.