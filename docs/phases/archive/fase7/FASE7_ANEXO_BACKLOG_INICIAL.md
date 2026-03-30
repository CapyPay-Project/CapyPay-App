# Fase 7 - Backlog inicial de evolución de niveles

> Estado documental: BORRADOR INICIAL / REFERENCIA HISTÓRICA.
>
> La planificación activa de Fase 7 continúa en:
> - `FASE7_ANEXO_PLAN_EJECUTABLE.md`
> - `FASE7_ANEXO_BACKLOG.md`

Cambios propuestos para evolución del sistema de niveles después del cierre de Fase 6.

## Objetivo

Convertir la instrumentación actual en un motor de optimización continua con decisiones automáticas y menor costo operativo.

## Tickets propuestos

| ID | Titulo | Prioridad | Entregable | Estado |
| --- | --- | --- | --- | --- |
| F7-S71-001 | Motor de promoción automática de variante A/B | P0 | Regla automática de ganador con guardrails | TODO |
| F7-S71-002 | Agregador diario de KPIs por segmento/variante | P0 | Tabla/servicio de métricas diarias persistidas | TODO |
| F7-S71-003 | Simulador de reglas de niveles antes de publicar config | P1 | Endpoint/herramienta de impacto estimado | TODO |
| F7-S71-004 | Anti-abuso adaptativo por segmento | P1 | Umbrales y límites por segmento de usuario | TODO |
| F7-S71-005 | Temporadas sobre progresión permanente | P2 | Diseño e implementación de season-pass ligero | TODO |

## Criterios de aceptación de Fase 7 (inicial)

- Decisión de variantes A/B reproducible y auditable.
- Consultas de métricas ejecutables sin scans pesados de eventos crudos.
- Cambios de configuración de niveles evaluables antes de producción.
- Reducción de falsos positivos de riesgo en segmentos legítimos.
- Nueva capa de engagement estacional sin romper economía base.
