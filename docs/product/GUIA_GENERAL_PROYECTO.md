# Guia general del proyecto CapyPay

Documento de onboarding para nuevos integrantes del equipo. Resume arquitectura, flujo de trabajo y comandos base para ponerse operativo en poco tiempo.

- Ultima actualizacion: 2026-03-31
- Ambito: onboarding tecnico y operativo del ecosistema CapyPay

## 1) Vista general

CapyPay esta dividido en 3 partes:

- CapyPay-App: frontend (Astro + Tailwind + componentes Astro/Svelte).
- capypay-backend: API backend (Node.js + Express + Supabase).
- capypay-db: scripts SQL base y soporte de migraciones.

Objetivo funcional actual:

- Wallet estudiantil (recarga, transferencias, historial).
- Servicios (cantina/comedor/pedidos).
- Gamificacion (misiones semanales, racha, recompensas, ranking).
- Operacion y monitoreo (salud, metricas, alertas, piloto).

Cambios recientes clave (frontend):

- Modulo Contactos eliminado del runtime (rutas/componentes/utilidades).
- TicketBus migrado a Leaflet por npm (sin vendor legacy en `public/vendor`).
- Persistencia de tickets movida a `ticketStore` real (Nanostores).
- Navegacion principal con prefetch para reducir latencia percibida entre paginas.

## 2) Arquitectura (alto nivel)

- Frontend consume API REST del backend.
- Backend orquesta logica de negocio y persiste en Supabase.
- DB se inicializa con scripts de capypay-db y migraciones especificas en backend/docs.
- Endpoints de operacion (/ops/*) exponen salud y metricas para seguimiento del piloto.

Flujo simplificado:

1. Usuario interactua con una pagina de App.
2. Frontend llama a /api/*.
3. Backend valida request, aplica reglas (auth/rate-limit/pilot) y consulta servicios/modelos.
4. Backend responde y frontend actualiza estado/UI.

## 3) Estructura de carpetas (resumen)

### Frontend

- CapyPay-App/src/pages: rutas de Astro.
- CapyPay-App/src/components: UI por dominio.
- CapyPay-App/src/services: cliente API frontend.
- CapyPay-App/src/store: estado cliente.
- CapyPay-App/docs: documentacion funcional y de proceso.

Notas actuales de frontend:

- Rutas compiladas activas: 18.
- Componentes Svelte en servicios se usan de forma puntual para interactividad compleja.

### Backend

- capypay-backend/src/routes: endpoints.
- capypay-backend/src/controllers: capa HTTP.
- capypay-backend/src/services: logica de negocio.
- capypay-backend/src/middleware: auth, observabilidad, rollout, rate-limit.
- capypay-backend/docs: API y migraciones del backend.

### Base de datos

- capypay-db/init.sql: esquema/base inicial.
- capypay-backend/docs/migrations*.sql: cambios evolutivos por fase.

## 4) Puesta en marcha local

### Requisitos

- Node.js LTS (18+ recomendado).
- npm.
- Proyecto clonado con las 3 carpetas del workspace.

### Frontend

1. Entrar en CapyPay-App.
2. Instalar dependencias: npm install.
3. Ejecutar: npm run dev.
4. URL local habitual: http://localhost:4321.

### Backend

1. Entrar en capypay-backend.
2. Instalar dependencias: npm install.
3. Ejecutar: npm run dev.
4. URL local habitual: http://localhost:3000.

## 5) Variables de entorno clave

### Backend (principales)

- PORT.
- SUPABASE_URL.
- SUPABASE_KEY.
- JWT_SECRET.
- ALLOWED_ORIGINS.

Observabilidad/piloto:

- OPS_METRICS_TOKEN.
- OPS_ALERT_WEBHOOK_URL.
- OPS_ALERT_COOLDOWN_SEC.
- OPS_ALERT_MIN_REQUESTS.
- OPS_ALERT_ERROR_RATE_THRESHOLD.
- OPS_ALERT_P95_MS_THRESHOLD.
- PILOT_ENABLED.
- PILOT_ROLLOUT_PERCENT.
- PILOT_ALLOWLIST.
- PILOT_BLOCKLIST.

### Frontend (principal)

- PUBLIC_API_URL (fallback local actual: http://localhost:3000/api).

## 6) Comandos frecuentes

### Frontend

- npm run dev: desarrollo.
- npm run build: build de produccion.
- npm run preview: preview local del build.
- npm run e2e:smoke: smoke E2E.

### Backend

- npm run dev: servidor con nodemon.
- npm run start: servidor normal.
- npm run test: pruebas unitarias.

## 7) Flujos que debes probar al iniciar

Checklist minimo para validar tu entorno:

1. Login exitoso en frontend.
2. Dashboard carga sin errores de consola severos.
3. Recarga/historial responden.
4. Misiones semanales visibles y acciones de progreso/claim funcionales.
5. Notificaciones visibles y marcables como leidas.
6. Backend /ops/health responde OK.

## 8) Calidad y pruebas

- Antes de abrir PR en frontend: ejecutar build y smoke E2E.
- Antes de abrir PR en backend: ejecutar test unitario.
- Si tocas flujo compartido (frontend+backend), valida ambas capas.

## 9) Documentacion y convenciones

- Frontend: mantener .md dentro de CapyPay-App/docs/.
- Estructura actual:
  - docs/phases/
  - docs/product/
  - docs/qa/
  - docs/pilot/
- En backend, mantener documentos tecnicos en capypay-backend/docs/.

## 10) Primeras tareas recomendadas para nuevos integrantes

1. Leer README de frontend y backend completos.
2. Levantar ambos servicios en local.
3. Ejecutar pruebas base (smoke y unitarias).
4. Revisar docs/phases para entender contexto del roadmap.
5. Tomar un issue pequeno de UI o endpoint para familiarizarse con el flujo de PR.