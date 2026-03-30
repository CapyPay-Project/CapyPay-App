# Segmentacion de misiones v1

> Estado documental: ANEXO HISTORICO.
>
> Este documento mantiene el detalle puntual de segmentación v1 cerrada en Fase 6.
> Para la definición funcional vigente del sistema de niveles, usar:
> `docs/product/SISTEMA_NIVELES_ACTUAL.md`.

Definicion de segmentacion para asignacion semanal de misiones en Fase 6.

## Objetivo

Ajustar dificultad y relevancia de misiones al perfil de progreso del usuario.

## Version

- segmentationVersion: v1
- profile: weekly_global_v1
- fuente de verdad runtime: gamification_config.mission_rules

## Segmentos activos

| Segmento | Criterio XP |
| --- | --- |
| nuevo | 0 - 199 |
| intermedio | 200 - 899 |
| avanzado | 900+ |

## Reglas operativas

1. Siempre se incluyen misiones de tipo global.
2. Se agregan misiones adicionales del segmento calculado.
3. Si no hay datos suficientes, se usa fallback seguro a plantilla global.
4. El segmento aplicado se persiste por semana para trazabilidad.

## Metricas clave por segmento

- totalMissions7d
- completedMissions7d
- claimedMissions7d
- completionRatePct
- claimRatePct

Disponibles en: /api/gamification/metrics/summary

## Consideraciones de UX

- Mostrar segmento activo en dashboard y modal de misiones.
- Mostrar contexto de segmento en niveles.
- Evitar ruido de notificaciones repetitivas; priorizar resumen semanal.
