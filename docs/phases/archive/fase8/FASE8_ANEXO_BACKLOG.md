# Fase 8 - Anexo backlog operativo

## Convencion de IDs

- Formato: F8-S{sprint}-{correlativo}
- Ejemplo: F8-S81-001

## Sprint 8.1

| ID | Titulo | Prioridad | Estimacion | Entregable | Estado |
| --- | --- | --- | --- | --- | --- |
| F8-S81-001 | Definir sistema visual unificado de widgets | P0 | M | Guia visual base misiones + nivel/racha | DONE |
| F8-S81-002 | Normalizar estados visuales de carga/degradado | P1 | S | Estados comunes en dashboard | DONE |
| F8-S81-003 | Retirar señales tecnicas de UI publica | P0 | S | UI sin segmento/reglas/cache | DONE |

## Sprint 8.2

| ID | Titulo | Prioridad | Estimacion | Entregable | Estado |
| --- | --- | --- | --- | --- | --- |
| F8-S82-001 | Implementar taxonomia de misiones por tipo | P0 | M | Modelo de tipos + render por secciones | DONE |
| F8-S82-002 | Redisenar modal de misiones por categorias | P0 | M | Modal final UX | DONE |
| F8-S82-003 | Agregar animacion de barras de progreso | P1 | M | Barras animadas al cargar/actualizar | DONE |
| F8-S82-004 | Cargar set ampliado de misiones por tipo | P1 | M | Catalogo de misiones enriquecido | DONE |

## Sprint 8.3

| ID | Titulo | Prioridad | Estimacion | Entregable | Estado |
| --- | --- | --- | --- | --- | --- |
| F8-S83-001 | Implementar reglas de racha academica | P0 | M | Exclusion de fines de semana/feriados | DONE |
| F8-S83-002 | Implementar consumo de escudos en racha | P0 | M | Escudos funcionales y trazables | DONE |
| F8-S83-003 | Exponer estados de dia para calendario | P1 | S | API de estados activo/protegido/inactivo/ignorado | DONE |

## Sprint 8.4

| ID | Titulo | Prioridad | Estimacion | Entregable | Estado |
| --- | --- | --- | --- | --- | --- |
| F8-S84-001 | Redisenar panel /account/niveles | P0 | M | Composicion final 1-2 widgets | DONE |
| F8-S84-002 | Implementar selector funcional de niveles | P0 | M | Selector + detalle por nivel | DONE |
| F8-S84-003 | Integrar calendario visual de racha | P0 | M | Calendario interactivo con estados | DONE |
| F8-S84-004 | Mostrar misiones completadas por dia | P1 | S | Drill-down diario de misiones | DONE |

## Sprint 8.5

| ID | Titulo | Prioridad | Estimacion | Entregable | Estado |
| --- | --- | --- | --- | --- | --- |
| F8-S85-001 | Limpiar logs cliente en dashboard/misiones/niveles | P0 | S | Consola sin datos sensibles | DONE |
| F8-S85-002 | Habilitar modo debug controlado por flag | P1 | S | Logging seguro por entorno | DONE |
| F8-S85-003 | Validacion QA de privacidad en consola | P1 | S | Checklist QA firmado | DONE |

## Reglas operativas

1. Ningun ticket P0 pasa a DONE sin evidencia funcional.
2. Todo cambio visual debe validarse en desktop y mobile.
3. Todo cambio de racha debe incluir casos con feriados y fines de semana.
4. Todo cambio de logs debe validarse manualmente en navegador.
