# CapyPay App

Documento maestro del frontend de CapyPay.

- Ultima actualizacion: 2026-04-02
- Ambito: arquitectura, rutas, scripts y estado operativo de CapyPay-App

## Actualizacion al 2026-04-02

- Fase 9 cerrada con el sistema Comercio v1 operativo en `/system/comercio`.
- Login y registro respetan contexto de sistema desde el landing (`usuario`, `comercio`, `transporte`).
- Comercio incluye gestion de cantinas, menu administrativo, ordenes, finanzas y retiros.
- El recibo de orden en `/services/order` sincroniza el estado con el backend para mantener coherencia operativa.

## Actualizacion al 2026-03-31

- Se elimino por completo el modulo de Contactos (ruta, componentes, utilidades y referencias runtime).
- Se limpio codigo legado no usado en widgets/comedor y controladores de pagina huérfanos.
- TicketBus migro a Leaflet por paquete npm (sin assets legacy en public/vendor).
- TicketBus ahora usa `ticketStore` real para persistencia de tickets en cliente.
- `SkeletonLoader` se reforzo y ya se usa en vistas reales (ej. carga inicial de historial en dashboard).
- Se activo prefetch en navegacion principal (Sidebar y BottomNav) para mejorar cambios de pagina.
- Se consolido el sistema de autenticacion unificado (`/auth/login` + `/auth/registro`) con widget unico.
- Se activo refresh automatico de sesion en cliente para evitar cierres por expiracion durante navegacion normal.
- Se agrego guardia global de sesion en layout principal y sincronizacion de logout entre pestanas.

## Actualizacion al 2026-04-01

- Integracion de Supabase adaptada a Astro (cliente y server) con lectura de variables `PUBLIC_*` y `NEXT_PUBLIC_*`.
- Se agrego ruta de diagnostico server-side en `/dev/supabase-diagnostico` para validar conexion frontend -> Supabase.
- Se reforzo el manejo de sesion en cliente para tratar `403` por token invalido como sesion expirada y reducir ruido en consola.
- Se agrego script `dev:clean` para limpiar cache de Vite (`node_modules/.vite`) en casos de dependencias optimizadas obsoletas.
- Se ajustaron dependencias de optimizacion de Vite para islas Svelte usadas en servicios (`lucide-svelte`, `embla-carousel-svelte`, `embla-carousel-autoplay`).
- TicketBus ahora sincroniza saldo con estado global de perfil y muestra estado de sincronizacion en la UI.
- CapyShop usa fallback de imagen local para evitar errores por placeholders externos bloqueados o caidos.

## Estado actual

El proyecto esta operativo sobre Astro con componentes Astro y Svelte, estilos con Tailwind CSS 4, logica en TypeScript/JavaScript y pruebas smoke E2E con Playwright.

Durante Fase 4 y Fase 5 se consolidaron:

- Flujo de gamificacion de usuario (misiones semanales, streak y reclamos de recompensas).
- Mejoras de UX y accesibilidad en dashboard, niveles y notificaciones.
- Integracion de QA automatizada para validar flujos criticos.
- Estructura de documentacion centralizada en docs/.

Durante el ciclo de hardening de auth tambien se consolidaron:

- Manejo robusto de token JWT en cliente (validacion de expiracion + limpieza segura de sesion).
- Renovacion de sesion transparente contra backend (`/api/session/refresh`).
- Parametrizacion completa de auth en `.env` para operacion por equipo sin cambios de codigo.

Durante Fase 9 tambien se consolidaron:

- Registro por rol con `comerciante` y `transportista`.
- Redireccion contextual post-login desde la landing.
- Panel `/system/comercio` con gestion de cantinas, productos, ordenes, finanzas y retiros.
- Sincronizacion del recibo de orden con estados operativos de comercio.

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
- /system/comercio: panel administrativo para cantinas, menu, ordenes, finanzas y retiros.
- /system/transporte: panel inicial administrativo para el sistema de transporte.

Rutas activas compiladas actualmente: 20.

## Flujos recomendados (referencia rapida)

- Flujo de acceso y uso diario: /auth/login -> /dashboard -> /account/notifications.
- Flujo de progreso gamificado: /dashboard -> /account/niveles -> /account/ranking.
- Flujo de recarga y control: /finance/recarga -> /finance/history.
- Flujo de pedido en servicios: /services/cantina o /services/comedor -> /services/checkout-cantina o /services/checkout -> /services/order -> /services/orders.
- Flujo de comercio: /auth/login?system=comercio -> /system/comercio -> gestion de cantinas, menu, ordenes y finanzas.
- Flujo de transporte: /auth/login?system=transporte -> /system/transporte.

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
- npm run dev:clean: limpia cache de Vite y levanta desarrollo.
- npm run build: compilacion de produccion.
- npm run check:quick: validacion estatica Astro.
- npm run preview: vista previa del build.
- npm run e2e:smoke: build + smoke tests E2E.
- npm run e2e:smoke:headed: smoke tests E2E en modo headed.

## Ejecucion local

1. Instalar dependencias:

```bash
npm install
```

1. Iniciar desarrollo:

```bash
npm run dev
```

1. Build de produccion:

```bash
npm run build
```

1. Validacion smoke E2E:

```bash
npm run e2e:smoke
```

## Variables de entorno (frontend)

Definir en `CapyPay-App/.env` (o copiar desde `CapyPay-App/.env.example`):

- `PUBLIC_API_URL`: URL base del backend (`/api`).
- `PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase para frontend.
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publica de Supabase para frontend.
- `PUBLIC_SESSION_REFRESH_WINDOW_MINUTES`: ventana previa para renovar sesion automaticamente.
- `PUBLIC_SESSION_REFRESH_COOLDOWN_SECONDS`: enfriamiento minimo entre refresh automaticos.
- `PUBLIC_SESSION_REFRESH_POLL_SECONDS`: intervalo de chequeo de refresh.
- `PUBLIC_SESSION_NOTICE_DELAY_MS`: tiempo de aviso visual antes de redirigir por sesion invalida.

## Notas

- Este README describe el frontend de CapyPay-App.
- Para backend, revisar capypay-backend/README.md.
