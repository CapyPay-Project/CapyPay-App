# CapyPay App

Documento maestro del frontend de CapyPay.

- Ultima actualizacion: 2026-03-31
- Ambito: arquitectura, rutas, scripts y estado operativo de CapyPay-App

## Actualizacion al 2026-03-31

- Se elimino por completo el modulo de Contactos (ruta, componentes, utilidades y referencias runtime).
- Se limpio codigo legado no usado en widgets/comedor y controladores de pagina huérfanos.
- TicketBus migro a Leaflet por paquete npm (sin assets legacy en public/vendor).
- TicketBus ahora usa `ticketStore` real para persistencia de tickets en cliente.
- `SkeletonLoader` se reforzo y ya se usa en vistas reales (ej. carga inicial de historial en dashboard).
- Se activo prefetch en navegacion principal (Sidebar y BottomNav) para mejorar cambios de pagina.

## Estado actual

El proyecto esta operativo sobre Astro con componentes Astro y Svelte, estilos con Tailwind CSS 4, logica en TypeScript/JavaScript y pruebas smoke E2E con Playwright.

Durante Fase 4 y Fase 5 se consolidaron:

- Flujo de gamificacion de usuario (misiones semanales, streak y reclamos de recompensas).
- Mejoras de UX y accesibilidad en dashboard, niveles y notificaciones.
- Integracion de QA automatizada para validar flujos criticos.
- Estructura de documentacion centralizada en docs/.

## Documentacion centralizada

La documentacion funcional y operativa vive en docs/:

- Fases: docs/phases/
- Plan ejecutable Fase 6 (Niveles 2.0): docs/phases/FASE6_NIVELES_2_0_PLAN_EJECUTABLE.md
- Backlog operativo Fase 6 (IDs y tablero): docs/phases/FASE6_BACKLOG_OPERATIVO.md
- Producto y roadmap: docs/product/
- QA: docs/qa/
- Piloto: docs/pilot/
- Onboarding general del proyecto: docs/product/GUIA_GENERAL_PROYECTO.md

Convencion de equipo:

- Evitar crear nuevos .md en la raiz (excepto README.md y WARP.md).

## Stack tecnologico actual

- Astro 5
- Tailwind CSS 4
- TypeScript
- Svelte (componentes interactivos puntuales)
- Nanostores
- Playwright (smoke E2E)

## Rutas principales

- / (landing): pagina publica de entrada y acceso rapido al flujo de autenticacion.
- /auth/login: inicio de sesion de usuarios.
- /auth/registro: registro de nuevos usuarios.
- /dashboard: vista principal del usuario con saldo, actividad y widgets de gamificacion.
- /account/profile: perfil del usuario y datos personales de cuenta.
- /account/notifications: bandeja de notificaciones y estado de lectura.
- /account/niveles: progreso de niveles, XP, recompensas y reclamos.
- /account/ranking: clasificacion semanal de usuarios y facultades.
- /account/settings: configuraciones generales de la cuenta.
- /finance/history: historial de transacciones y movimientos.
- /finance/recarga: flujo de recarga de saldo.
- /services/cantina: catalogo de cantinas y productos disponibles.
- /services/comedor: experiencia de comedor (menu, cola y estado de servicio).
- /services/checkout: checkout general para compras o pagos del ecosistema.
- /services/checkout-cantina: checkout especializado para pedidos de cantina.
- /services/order: detalle y seguimiento de una orden puntual.
- /services/orders: listado historico de ordenes del usuario.
- /services/ticketbus: modulo de ticketing/transporte dentro de servicios.

Rutas activas compiladas actualmente: 18.

## Flujos recomendados (referencia rapida)

- Flujo de acceso y uso diario: /auth/login -> /dashboard -> /account/notifications.
- Flujo de progreso gamificado: /dashboard -> /account/niveles -> /account/ranking.
- Flujo de recarga y control: /finance/recarga -> /finance/history.
- Flujo de pedido en servicios: /services/cantina o /services/comedor -> /services/checkout-cantina o /services/checkout -> /services/order -> /services/orders.

## Estructura del proyecto

```text
CapyPay-App/
  public/                  # Activos estaticos (imagenes, fuentes y recursos publicos)
  src/
    components/            # Componentes reutilizables de UI y modulos por dominio
      account/             # Componentes de perfil y secciones de cuenta
      comedor/svelte/      # Componentes Svelte para experiencias interactivas de comedor
      dashboard/           # Widgets principales del dashboard (finanzas, acciones, gamificacion)
      finance/             # Componentes de finanzas (historial, filtros, tablas)
      layout/              # Navegacion y estructura global (Navbar, Sidebar, BottomNav)
      ranking/             # Componentes de ranking y visualizacion competitiva
      ui/                  # Sistema base de componentes UI reutilizables
      widgets/             # Widgets verticales para servicios (cantina/comedor y auxiliares)
    layouts/               # Layouts de pagina (estructura comun por tipo de vista)
    pages/                 # Rutas de Astro (cada archivo mapea a una URL)
      account/             # Rutas de cuenta del usuario
      auth/                # Rutas de autenticacion
      dashboard/           # Ruta del panel principal
      finance/             # Rutas financieras
      services/            # Rutas de servicios transaccionales
    services/              # Cliente API y acceso a backend desde frontend
    store/                 # Estado global/local (nanostores y persistencia de cliente)
    styles/                # Estilos globales y parciales CSS
    utils/                 # Utilidades de negocio y helpers compartidos
  docs/                    # Documentacion funcional, tecnica y operativa
    phases/                # Planificacion por fases y sprints
    product/               # Roadmap, manifiestos y decisiones de producto
    qa/                    # Matrices de regresion y guias de prueba
    pilot/                 # Operacion de piloto (KPI, go/no-go, rollback)
```

## Scripts disponibles

- npm run dev: servidor de desarrollo.
- npm run build: compilacion de produccion.
- npm run preview: vista previa del build.
- npm run e2e:smoke: build + smoke tests E2E.
- npm run e2e:smoke:headed: smoke tests E2E en modo headed.

## Ejecucion local

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar desarrollo:

```bash
npm run dev
```

3. Build de produccion:

```bash
npm run build
```

4. Validacion smoke E2E:

```bash
npm run e2e:smoke
```

## Notas

- Este README describe el frontend de CapyPay-App.
- Para backend, revisar capypay-backend/README.md.