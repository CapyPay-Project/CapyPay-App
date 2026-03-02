# Historial - Componentes de UI

Este módulo contiene la UI fragmentada de la página de historial financiero.

## Archivos

- `HistoryHeader.astro`: título y acciones principales.
- `HistoryFilters.astro`: filtros por tipo, texto y rango de fechas.
- `HistoryTable.astro`: listado dinámico de movimientos y paginación.
- `TransactionModal.astro`: modal de detalle de transacción.

## Lógica asociada

La orquestación de estado y eventos se realiza en:

- `src/utils/pages/historyPage.js`

Incluye carga de datos, filtros, paginación, modal y exportación PDF.
