# Fase 9 - Anexo backlog ejecutable

## Convencion de IDs

- Formato: F9-S{sprint}-{correlativo}
- Ejemplo: F9-S91-001

## Sprint 9.1 - Hardening de compatibilidad (inicio implementacion)

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S91-001 | Proteger rutas de orden cantina con JWT | P0 | S | capypay-backend/src/routes/cantina.routes.js | `POST /order`, `GET /order/:id`, `GET /orders/:userId`, `PATCH /order/:id/status` con middleware auth | DONE |
| F9-S91-002 | Validar ownership en createOrder | P0 | M | capypay-backend/src/controllers/cantina.controller.js | `user_id` del token o validado contra token; rechazo si hay mismatch | DONE |
| F9-S91-003 | Validar ownership en getOrderById y getUserOrders | P0 | M | capypay-backend/src/controllers/cantina.controller.js | Usuario solo consulta ordenes propias; respuestas 403 consistentes | DONE |
| F9-S91-004 | Ajustar frontend checkout para no depender de inferencia fragil de cantina | P1 | M | CapyPay-App/src/pages/services/checkout-cantina.astro | Identificacion robusta de `cantina_id` en compra | DONE |
| F9-S91-005 | QA regresion flujo usuario cantina | P0 | S | CapyPay-App/src/pages/services/cantina.astro, CapyPay-App/src/pages/services/checkout-cantina.astro, CapyPay-App/src/pages/services/order.astro | Compra completa funcionando sin regresion visual | DONE |

Criterios de aceptacion Sprint 9.1:

- Compra de cantina funciona end-to-end para usuario autenticado.
- Ningun usuario puede crear o consultar ordenes de otro usuario.
- Check de frontend y tests backend en verde.

Evidencia QA Sprint 9.1 (2026-04-02):

- Endpoints protegidos sin token responden `401`:
  - `POST /api/cantinas/order`
  - `GET /api/cantinas/orders/:userId`
  - `GET /api/cantinas/order/:id`
  - `PATCH /api/cantinas/order/:id/status`
- Con token valido y ownership incorrecto responden `403`:
  - `GET /api/cantinas/orders/otro-usuario`
  - `POST /api/cantinas/order` con `user_id` distinto al del token.
- Con token valido y payload incompleto en usuario propio responde `400` (validacion de negocio activa).
- Validacion tecnica:
  - Frontend: `npm run check:quick` en verde (0 errores, 0 warnings).
  - Backend: `npm test` en verde (33 pass, 0 fail).

## Sprint 9.2 - Dominio de propietario y cantina

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S92-001 | Crear migracion de `cantina_owners` | P0 | M | capypay-backend/docs/migrations.md | Tabla de ownership por cantina y indices minimos | DONE |
| F9-S92-002 | Endpoint `GET /me/cantinas` | P0 | M | capypay-backend/src/routes/systemComercio.routes.js, capypay-backend/src/controllers/systemComercio.controller.js | Lista de cantinas asociadas al propietario autenticado | DONE |
| F9-S92-003 | Endpoint crear cantina administrativa | P0 | M | capypay-backend/src/routes/systemComercio.routes.js, capypay-backend/src/controllers/systemComercio.controller.js | Alta de cantina con ownership inicial | DONE |
| F9-S92-004 | Endpoint editar cantina (estado y datos base) | P0 | M | capypay-backend/src/controllers/systemComercio.controller.js | Actualizacion de estado `open/closed/inactive` y datos permitidos | DONE |
| F9-S92-005 | Vista Mis Cantinas en system/comercio | P1 | M | CapyPay-App/src/pages/system/comercio.astro, CapyPay-App/src/services/api.js | Listado y accion basica por cantina | DONE |

Evidencia Sprint 9.2 (2026-04-02):

- Backend:
  - Nuevas rutas montadas en `GET/POST/PATCH /api/system/comercio/*`.
  - Nuevo controlador `systemComercio.controller.js` con ownership por `cantina_owners`.
  - Migraciones agregadas para `cantina_owners` y campos operativos de `cantinas`.
- Frontend:
  - Servicio `comercioSystemService` agregado a cliente API.
  - Vista `/system/comercio` conectada a backend con listar, crear y cambiar estado basico.
- Smoke:
  - `GET /api/system/comercio/me/cantinas` sin token -> `401`.
  - `GET /api/system/comercio/me/cantinas` con token -> `500` esperado hasta aplicar migracion (`cantina_owners` no existe en schema cache).
- Validacion tecnica:
  - Frontend: `npm run check:quick` en verde.
  - Backend: `npm test` en verde.

Pendiente operativo para cerrar despliegue funcional de Sprint 9.2:

- Revisar `capypay-backend/docs/migrations.md` para el resumen documental de `cantina_owners` y columnas nuevas.

## Sprint 9.2B - Registro por rol y acceso por contexto

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S92-006 | Habilitar tipos `comerciante` y `transportista` en registro backend | P0 | S | capypay-backend/src/controllers/user.controller.js | Registro acepta ambos tipos sin romper tipos existentes | DONE |
| F9-S92-007 | Registro condicional sin campos academicos para comercio/transporte | P0 | M | CapyPay-App/src/pages/auth/login.astro (modo registro), capypay-backend/src/controllers/user.controller.js | Validacion de campos por tipo de usuario | DONE |
| F9-S92-008 | Mantener permisos de usuario general para comercio/transporte | P0 | M | capypay-backend/src/controllers/user.controller.js, CapyPay-App/src/services/api.js | Wallet y consumo disponibles para ambos roles | DONE |
| F9-S92-009 | Redireccion post-login por contexto de sistema seleccionado | P0 | M | CapyPay-App/src/pages/index.astro, CapyPay-App/src/pages/auth/login.astro, CapyPay-App/src/services/api.js | Login unico con destino por contexto (usuario/comercio/transporte) | DONE |
| F9-S92-010 | Definir placeholder de aprobacion administrativa futura | P1 | S | CapyPay-App/docs/phases/FASE9.md, CapyPay-App/docs/phases/archive/fase9/FASE9_ANEXO_BACKLOG_EJECUTABLE.md | Nota de roadmap de aprobacion manual con feature flag | DONE |

Criterios de aceptacion Sprint 9.2B:

- Registro de comerciante/transportista funciona sin facultad, carrera y sede/nucleo.
- Login unico respeta contexto de entrada y evita redireccion fija al dashboard de usuario.
- Comercio/transporte conservan capacidades base de usuario (wallet y consumo).
- Multirol simultaneo queda explicitamente fuera de alcance en esta fase.

## Sprint 9.3 - Menu administrativo

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S93-001 | Endpoints CRUD producto por cantina | P0 | M | capypay-backend/src/routes/systemComercio.routes.js, capypay-backend/src/controllers/systemComercio.controller.js | Crear/editar/desactivar productos con ownership | DONE |
| F9-S93-002 | Validaciones de negocio en productos | P0 | S | capypay-backend/src/controllers/systemComercio.controller.js | Precio >= 0, stock >= 0, nombre obligatorio | DONE |
| F9-S93-003 | UI de administracion de menu | P0 | L | CapyPay-App/src/pages/system/comercio.astro | Tabla/form de productos y acciones publicar/agotar/ocultar | DONE |
| F9-S93-004 | Reflejo inmediato en sistema usuario | P1 | M | CapyPay-App/src/pages/services/cantina.astro | Productos y estado actualizados desde backend | DONE |

## Sprint 9.4 - Operacion de ordenes

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S94-001 | Listado de ordenes por cantina | P0 | M | capypay-backend/src/controllers/systemComercio.controller.js | Filtro por estado y rango de fechas | DONE |
| F9-S94-002 | Motor de transicion de estado | P0 | M | capypay-backend/src/controllers/systemComercio.controller.js | Reglas validas de cambio de estado | DONE |
| F9-S94-003 | Cola operativa en frontend comercio | P1 | M | CapyPay-App/src/pages/system/comercio.astro | Panel para actualizar estado de pedidos | DONE |
| F9-S94-004 | Sincronizacion de estado en recibo usuario | P1 | S | CapyPay-App/src/pages/services/order.astro | Estado de orden coherente con backend cantina | DONE |

## Sprint 9.5 - Finanzas y analitica

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S95-001 | Migracion de `cantina_ledger` | P0 | M | capypay-backend/docs/migrations.md | Ledger de ingresos brutos, fee, neto por orden | DONE |
| F9-S95-002 | Poblado de ledger en createOrder | P0 | M | capypay-backend/src/controllers/cantina.controller.js | Registro contable por venta de cantina | DONE |
| F9-S95-003 | Endpoint de metricas por rango | P0 | M | capypay-backend/src/controllers/systemComercio.controller.js | Series daily/weekly/monthly/quarterly + KPIs | DONE |
| F9-S95-004 | Dashboard de ingresos comercio | P1 | L | CapyPay-App/src/pages/system/comercio.astro | Graficas y tarjetas de ingresos/clientes/ticket promedio | DONE |

## Sprint 9.6 - Retiros de fondos v1

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F9-S96-001 | Migracion `cantina_withdrawal_accounts` | P0 | M | capypay-backend/docs/migrations.md | Datos bancarios de retiro por cantina | DONE |
| F9-S96-002 | Migracion `cantina_withdrawals` | P0 | M | capypay-backend/docs/migrations.md | Solicitudes de retiro con estados auditables | DONE |
| F9-S96-003 | Endpoints de cuenta bancaria y retiros | P0 | M | capypay-backend/src/routes/systemComercio.routes.js, capypay-backend/src/controllers/systemComercio.controller.js | Crear cuenta, solicitar retiro, listar retiros | DONE |
| F9-S96-004 | Vista de retiros en frontend comercio | P1 | M | CapyPay-App/src/pages/system/comercio.astro | Formulario de solicitud y tabla de estados | DONE |

## Dependencias tecnicas

- Sprint 9.1 bloquea el inicio de 9.2.
- Sprint 9.2 bloquea ownership para 9.3 y 9.4.
- Sprint 9.5 debe estar estable antes de liberar 9.6.

## Checklist de inicio de implementacion (Day 1)

- Crear rama de trabajo para fase 9.
- Ejecutar baseline: `npm run check:quick` en frontend y `npm test` en backend.
- Implementar tickets F9-S91-001 y F9-S91-002 primero.
- Validar compra real de cantina con usuario autenticado.
- Registrar evidencia de QA de no regresion.

## Definicion de listo por ticket (DoR)

- Scope funcional concreto en 1-2 frases.
- Archivos objetivo identificados.
- Criterio de aceptacion verificable.
- Riesgo de regresion identificado si aplica.

## Definicion de terminado por ticket (DoD)

- Codigo integrado sin romper contrato publico actual de Usuario.
- Validacion local ejecutada (frontend/backend segun aplique).
- Evidencia funcional minima (captura o log de prueba).
- Documentacion de endpoint/payload actualizada cuando aplique.
