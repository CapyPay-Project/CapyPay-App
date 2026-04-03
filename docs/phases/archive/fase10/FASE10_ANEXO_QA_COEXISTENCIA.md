# Fase 10 - QA de coexistencia TicketBus y Transporte

Fecha de ejecucion: 2026-04-02

## Objetivo

Verificar que TicketBus (usuario final) y Transporte (panel operativo) conviven sin regresiones funcionales y consumen el mismo estado operativo.

## Alcance validado

- Flujo de usuario final en TicketBus con feed operativo de Transporte.
- Flujo de operador en panel de Transporte con cambios de estado y auditoria.
- Coherencia de datos entre ambos sistemas.
- Accesibilidad basica y uso mobile/desktop en vistas tocadas.

## Matriz de pruebas

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| QA-105-001 | TicketBus carga `public/overview` | Muestra rutas, paradas y unidades reales si el feed esta disponible | OK |
| QA-105-002 | TicketBus sin feed operativo | Fallback local sin romper el wizard ni renderizados | OK |
| QA-105-003 | Transporte cambia ruta a `saturada` | Endpoint responde y el dashboard refleja nuevo estado | OK |
| QA-105-004 | Transporte inactiva parada | Parada queda en baja logica (`inactiva`) y se ve en panel | OK |
| QA-105-005 | Transporte cambia estado de unidad | Estado y ocupacion actualizan en dashboard y auditoria | OK |
| QA-105-006 | Reasignacion de unidad | Registro visible en auditoria operativa | OK |
| QA-105-007 | TicketBus muestra alertas sincronizadas | Novedades renderizadas desde feed cuando hay alertas | OK |
| QA-105-008 | Drawer y modal en TicketBus por teclado | Apertura/cierre manejables y con foco retornando correctamente | OK |
| QA-105-009 | Panel Transporte en mobile | Botones rapidos adaptan layout sin overflow | OK |
| QA-105-010 | Estado visual en desktop | Listas, forms y auditoria se mantienen legibles | OK |

## Accesibilidad aplicada

- Roles y regiones vivas (`role=status`, `aria-live`) en estados y notificaciones.
- Dialogos etiquetados para drawer y modal QR en TicketBus.
- Botones operativos con `type=button` para evitar submits accidentales.
- Mejoras de foco visible en controles interactivos de Transporte.

## Riesgos residuales

- La auditoria actual es derivada de estado y timestamps de tablas operativas; no reemplaza un event-log dedicado.
- Si cambian campos de tablas en Supabase, el feed operativo requiere ajuste de mapeos.

## Resultado

Coexistencia validada: TicketBus y Transporte comparten contrato operativo sin acoplarse en UI y sin romper los flujos principales.
