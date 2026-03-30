# Fase 7.3 - Reporte de latencia percibida (S73-006)

Fecha de ejecucion: 2026-03-30
Estado: COMPLETADO

## Objetivo

Cerrar F7-S73-006 con evidencia before/after de latencia percibida en el flujo Dashboard -> Niveles.

## Metodologia

Escenario medido:

- Ruta origen: /dashboard
- Ruta destino: /account/niveles?from=dashboard
- Metrica principal: `dashboard_to_niveles_ready_ms`

Definicion de metrica:

- Tiempo desde click en enlace de Niveles hasta que la pagina de destino muestra estado visible en `#levels-data-state` (sincronizado/cache/degradado).

Comparativa ejecutada:

1. Before (sin prefetch): click directo en enlace.
2. After (con prefetch): hover previo de 700ms en enlace para disparar calentamiento de datos.

Herramienta:

- Playwright headless con 6 corridas por modo.
- Sesion simulada por localStorage (`capypay_user`, `capypay_token`) para evitar redireccion a login.
- Frontend servido con `astro preview` en `http://127.0.0.1:4321`.

## Resultados cuantitativos

### Before (sin prefetch)

- Samples (ms): 2341, 1505, 1684, 1268, 1257, 2451
- Promedio: 1751.00 ms
- P50: 1505 ms
- P95: 2451 ms

### After (con prefetch)

- Samples (ms): 1281, 1001, 835, 972, 1269, 771
- Promedio: 1021.50 ms
- P50: 972 ms
- P95: 1281 ms

### Delta before/after

- Reduccion promedio: 729.50 ms
- Mejora porcentual promedio: 41.66%

## Web-vitals observados

Se capturaron eventos `capypay-web-vitals` y logs locales `[CapyPay][WebVitals]` en dashboard/niveles durante la prueba.

Muestra representativa (corrida baseline):

- Dashboard PAGE_READY: 891.7 ms
- Dashboard FCP/LCP: 1072 ms
- Niveles PAGE_READY: 448.5 ms
- Niveles FCP/LCP: 800 ms

Muestra representativa (corrida optimizada):

- Dashboard PAGE_READY: 1344 ms
- Dashboard FCP/LCP: 1372 ms
- Niveles PAGE_READY: 619.1 ms
- Niveles FCP/LCP: 628 ms

## Conclusion

S73-006 queda cumplido: hay evidencia before/after con mejora significativa en latencia percibida de navegacion hacia Niveles.

- El prefetch Dashboard -> Niveles reduce el tiempo promedio de disponibilidad visual de estado en ~41.66%.
- El P95 tambien mejora de 2451 ms a 1281 ms.

## Nota de interpretacion

En varias corridas el estado final de Niveles reporto "estado: resumen degradado" por disponibilidad de datos backend en ese momento; aun asi, la comparativa es valida porque la condicion fue consistente en ambos grupos (before y after), aislando el efecto de prefetch/SWR sobre la percepcion de carga del flujo de navegacion.
