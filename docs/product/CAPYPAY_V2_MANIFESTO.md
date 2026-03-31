# CAPYPAY V2 MANIFESTO: NEO-BRUTALIST PROTOCOL

Manifesto de referencia para decisiones de producto, UX y estabilidad tecnica en V2.

- Ultima actualizacion: 2026-03-31
- Ambito: direccion de producto para UI, arquitectura y performance

## Los 3 pilares de V2

1. Neo-Brutalismo funcional: UI fuerte, legible y consistente.
2. Resiliencia de frontend: fallas parciales no deben tumbar la experiencia completa.
3. Ecosistema gamificado: wallet + servicios + progreso de usuario en un mismo flujo.

---

## TRACK 1: UI / DISEÑO

- [x] Recarga (`/finance/recarga`) integrada al estilo neo-brutalist.
- [x] Dashboard principal migrado al lenguaje visual V2.
- [x] Correcciones de capas/z-index en overlays y popovers.
- [x] Limpieza de rutas y vistas obsoletas (incluida eliminacion de Contactos).
- [ ] Homologar completamente `profile` y `settings` al mismo nivel visual de dashboard/servicios.
- [ ] Definir y cerrar guideline unico de animaciones y estados hover.

---

## TRACK 2: ARQUITECTURA / BACKEND / GAMIFICACION

- [x] Integracion estable de XP en flujos transaccionales relevantes.
- [x] Ranking operativo por usuarios/facultades con capa de frontend desacoplada.
- [x] Servicio de TicketBus conectado con persistencia de tickets en store cliente.
- [ ] Panel backoffice para aprobaciones y operaciones manuales.
- [ ] Reglas de economia XP consolidada por canal (recarga, pedidos, transporte).

---

## TRACK 3: UX / ESTABILIDAD / PERFORMANCE

- [x] Endurecimiento de vistas criticas de servicios (Cantina/Ranking/TicketBus).
- [x] Eliminacion de imports dinamicos fragiles que causaban errores de optimize deps.
- [x] Migracion de Leaflet a npm en TicketBus y retiro de vendor legacy.
- [x] Prefetch de navegacion principal (Sidebar + BottomNav) para mejorar cambios de pagina.
- [x] Skeletons reutilizables en vistas reales para mejorar percepcion de carga.
- [ ] Continuar eliminando waterfalls de fetch y pasar a patrones de carga progresiva.
- [ ] Instrumentar medicion por ruta (tiempos de carga y cuellos API) para tuning fino.

---

## Definicion de calidad V2

Una entrega V2 se considera cerrada cuando:

- Build de frontend en verde.
- Sin rutas obsoletas ni referencias runtime a modulos eliminados.
- Sin errores de consola bloqueantes en flujos criticos.
- UX tolerante a fallas parciales de API.
- Documentacion maestra actualizada al estado real del codigo.
