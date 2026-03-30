# Fase 6 - Backlog operativo (tablero ejecutable)

> Documento maestro vigente de la fase: `FASE6.md`.
> Este archivo se mantiene como anexo historico.

Backlog listo para crear issues/tickets de ejecucion inmediata.

## Convencion de IDs

- Formato: F6-S{sprint}-{correlativo}
- Ejemplo: F6-S61-001

Estados sugeridos:

- TODO
- IN_PROGRESS
- BLOCKED
- IN_REVIEW
- DONE

Prioridades:

- P0: critico para objetivo de fase
- P1: alto impacto
- P2: mejora importante

Estimacion sugerida:

- S: <= 1 dia
- M: 2-3 dias
- L: 4-5 dias

---

## Sprint 6.1 - Balance y progresion

### Objetivo sprint

Versionar reglas de niveles y estabilizar curva de progreso.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F6-S61-001 | Definir curva XP por nivel v1 | P0 | M | Ninguna | Documento de balance validado | DONE |
| F6-S61-002 | Crear config versionada de balance en backend | P0 | L | F6-S61-001 | Fuente unica de reglas en servicio/config | DONE |
| F6-S61-003 | Exponer endpoint de config efectiva de niveles | P1 | M | F6-S61-002 | Endpoint /api/gamification/config/public extendido | DONE |
| F6-S61-004 | Adaptar progresion/claim para usar config versionada | P0 | L | F6-S61-002 | Calculos desacoplados de hardcode | DONE |
| F6-S61-005 | Tests unitarios de limites y transiciones de nivel | P0 | M | F6-S61-004 | Cobertura de casos limite de progresion | DONE |
| F6-S61-006 | Plan de migracion de usuarios a curva v1 | P1 | S | F6-S61-001 | Guia de migracion documentada | DONE |

Checklist de cierre Sprint 6.1:

- [x] Reglas de niveles no dependen de hardcode fijo.
- [x] Tests de progresion en verde.
- [x] Documento BALANCE_NIVELES_V1.md publicado.

---

## Sprint 6.2 - Misiones por segmentos

### Objetivo sprint

Asignar misiones segun perfil de usuario para aumentar engagement.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F6-S62-001 | Definir segmentacion inicial de usuarios | P0 | M | F6-S61-001 | Criterios de segmento (nuevo, recurrente, power-user) | DONE |
| F6-S62-002 | Implementar asignador de misiones por segmento | P0 | L | F6-S62-001, F6-S61-004 | Servicio de asignacion con fallback | DONE |
| F6-S62-003 | Persistir segmento y version de reglas por usuario | P1 | M | F6-S62-002 | Trazabilidad de reglas aplicadas | DONE |
| F6-S62-004 | Exponer metricas por segmento en summary | P1 | M | F6-S62-002 | Metricas por segmento en endpoint | DONE |
| F6-S62-005 | Actualizar UI para mostrar contexto de mision | P1 | M | F6-S62-002 | Dashboard/Niveles con contexto de segmento | DONE |
| F6-S62-006 | Smoke E2E de misiones segmentadas | P0 | M | F6-S62-005 | Validacion de flujo critico en CI/local | DONE |

Checklist de cierre Sprint 6.2:

- [x] Usuarios reciben misiones consistentes con su segmento.
- [x] Existe fallback cuando no hay segmento disponible.
- [x] KPIs por segmento visibles y entendibles.

---

## Sprint 6.3 - Anti-abuso y resiliencia

### Objetivo sprint

Mitigar fraude en progreso/claims y mejorar respuesta operativa.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F6-S63-001 | Definir score de riesgo v1 para gamificacion | P0 | M | F6-S62-004 | Politica de score y umbrales | DONE |
| F6-S63-002 | Implementar calculo de riesgo en progress/claim | P0 | L | F6-S63-001 | Evaluacion de riesgo por accion | DONE |
| F6-S63-003 | Aplicar rate-limit adaptativo por riesgo | P0 | M | F6-S63-002 | Limites dinamicos por perfil de riesgo | DONE |
| F6-S63-004 | Registrar eventos de riesgo para auditoria | P1 | M | F6-S63-002 | Logs/eventos de seguridad operativa | DONE |
| F6-S63-005 | Configurar alertas operativas anti-abuso | P1 | M | F6-S63-004 | Alertas accionables sin spam | DONE |
| F6-S63-006 | Definir flujo de revision/desbloqueo manual | P2 | S | F6-S63-001 | Runbook operativo de excepciones | DONE |

Checklist de cierre Sprint 6.3:

- [x] Reduccion de claims anormales.
- [x] Alertas utiles y con cooldown funcional.
- [x] Sin impacto negativo fuerte en usuarios legitimos.

---

## Sprint 6.4 - Experimentacion UX y cierre

### Objetivo sprint

Optimizar conversion y cerrar fase con decision basada en datos.

| ID | Titulo | Prioridad | Estimacion | Dependencias | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F6-S64-001 | Definir experimentos A/B de gamificacion v1 | P0 | M | F6-S62-004 | Hipotesis y metricas por experimento | DONE |
| F6-S64-002 | Implementar asignacion de variante y tracking | P0 | L | F6-S64-001 | Instrumentacion de experimentos | DONE |
| F6-S64-003 | Mejorar UX de resumen semanal en niveles/notificaciones | P1 | M | F6-S64-001 | Bloque de progreso semanal claro | DONE |
| F6-S64-004 | Ejecutar regresion completa de release | P0 | M | F6-S64-002, F6-S64-003 | Build/test/smoke en verde | DONE |
| F6-S64-005 | Publicar informe final y decision de fase | P0 | S | F6-S64-004 | FASE6_ANEXO_RESULTADOS.md | DONE |

Checklist de cierre Sprint 6.4:

- [x] Experimentos con datos suficientes para decision.
- [x] UX final sin ruido de notificaciones.
- [x] KPIs comparados contra baseline de inicio de fase.

---

## Orden sugerido de ejecucion

1. Ejecutar todo Sprint 6.1.
2. Iniciar 6.2 con 001 y 002 en paralelo parcial (producto + backend).
3. Activar 6.3 en modo observacion primero, bloqueo despues.
4. Cerrar en 6.4 con decision go/no-go de evolucion 6.x.

## Reglas operativas del tablero

1. Ningun ticket pasa a DONE sin evidencia de prueba.
2. Todo ticket P0 requiere criterio de rollback o fallback.
3. Si un ticket cambia API publica, actualizar README/API en el mismo PR.
4. Si un ticket afecta UX de misiones/notificaciones, validar mobile y desktop.

## Plantilla minima para cada issue

Copiar y pegar en el tracker (GitHub/Jira/Linear):

```text
ID: F6-Sxx-xxx
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