# WARP.md

Guia operativa para trabajar en CapyPay-App desde terminales asistidas.

- Ultima actualizacion: 2026-03-31
- Ambito: operacion tecnica, comandos y convenciones de trabajo

## Estado del proyecto

- Frontend productivo con Astro 5 + Tailwind CSS 4.
- Stack mixto Astro/Svelte para secciones interactivas (especialmente servicios).
- Estado cliente con Nanostores.
- Build estatico con rutas de app autenticada.
- Modulo Contactos eliminado del runtime.

## Comandos de desarrollo

### Basicos

- `npm install`: instalar dependencias.
- `npm run dev`: iniciar entorno local.
- `npm run build`: compilacion de produccion.
- `npm run preview`: previsualizar build.
- `npm run astro`: utilidades CLI de Astro.

### Calidad

- `npm run check:quick`: chequeo de tipos y proyecto con Astro.
- `npm run e2e:smoke`: build + smoke tests E2E con Playwright.
- `npm run e2e:smoke:headed`: smoke tests E2E en modo visual.

## Convenciones de trabajo

- Mantener documentacion funcional en `docs/` (evitar nuevos `.md` en raiz salvo README/WARP).
- Preferir cambios pequeños y verificables con build.
- No reintroducir rutas eliminadas de `src/pages` (ej. modulo Contactos).
- Para navegacion global, conservar `data-astro-prefetch` en enlaces principales.

## Estructura relevante

- `src/pages/`: rutas.
- `src/components/`: UI por dominio.
- `src/services/`: cliente API.
- `src/store/`: estado cliente (Nanostores).
- `src/layouts/`: shell principal.
- `docs/`: documentacion por producto/fases/QA/piloto.

## Notas de rendimiento

- TicketBus usa Leaflet por npm y no por assets legacy en `public/vendor`.
- `SkeletonLoader` esta habilitado para cargas iniciales de vistas criticas.
- Navegacion desktop/mobile principal con prefetch activo para reducir tiempo percibido entre paginas.
