# Balance de niveles v1

> Estado documental: ANEXO HISTORICO.
>
> Este documento mantiene el detalle puntual de la curva v1 cerrada en Fase 6.
> Para la definición funcional vigente del sistema de niveles, usar:
> `docs/product/SISTEMA_NIVELES_ACTUAL.md`.

Documento de referencia para la curva de progresion de Fase 6.

## Objetivo

Mantener una progresion de XP sostenible, entendible para usuario y segura para economia de recompensas.

## Version

- profile: levels_v1
- version: 6.1.0
- fuente de verdad runtime: gamification_config (backend)

## Curva de niveles v1

| Nivel | Nombre | XP minima | XP maxima | Beneficio |
| --- | --- | --- | --- | --- |
| 1 | Novato (Cachorro) | 0 | 500 | Sin descuento |
| 2 | Bachiller | 501 | 2000 | 5% descuento |
| 3 | Licenciado | 2001 | 5000 | 10% descuento |
| 4 | Magister | 5001 | 10000 | 15% + VIP |
| 5 | Doctor | 10001 | 20000 | 20% + VIP |
| 6 | Capy Legend | 20001 | sin tope | 25% + VIP |

## Caps de XP (v1)

- perEvent.recharge: 100
- perEvent.transfer: 50
- perEvent.comedor_purchase: 120
- perEvent.cantina_purchase: 120
- perEvent.mission: 150
- perEvent.reward: 150
- dailyGlobal: 400

## Criterios de balance

1. Evitar inflacion de XP diaria por automatizacion o abuso.
2. Permitir progreso perceptible con uso legitimo semanal.
3. Preservar diferencia entre uso casual y uso recurrente.
4. Alinear perks de nivel con impacto economico sostenible.

## Regla de migracion

Cuando cambie la curva:

1. Publicar nueva version en gamification_config.
2. Mantener compatibilidad de lectura para frontend via /api/gamification/config/public.
3. Ejecutar validacion de regresion (tests backend + build frontend + smoke E2E).
4. No decrementar XP historica de usuarios; solo recalcular nivel efectivo por nueva curva.
