# Fase 9 - System Comercio en armonia con Usuario

Fecha de consolidacion: 2026-04-02
Estado: CERRADA (MVP v1 completado)

## Objetivo

Implementar el sistema administrativo de comercio para propietarios de cantina, sin romper el flujo actual de compra del usuario final en `/services/cantina` y `/services/checkout-cantina`.

## Baseline actual (confirmado)

- Usuario final consume cantinas y productos por API publica (`/api/cantinas`, `/api/cantinas/faculties`).
- Checkout cantina crea orden en `/api/cantinas/order` y descuenta saldo del perfil.
- Historial financiero del usuario ya integra consumos de `cantina_orders`.
- No existe modelo de propietario de cantina ni panel administrativo con control por rol.
- Rutas de cantina administrativas y de orden requieren hardening de seguridad para ownership real.

## Vision funcional de negocio

- Cada cantina opera como cuenta de negocio dentro de CapyPay.
- El propietario administra su cantina: estado operativo, menu, disponibilidad, stock y configuracion base.
- El sistema expone panel de ingresos y actividad con cortes diario, semanal, mensual y trimestral.
- El comercio podra solicitar retiro de fondos hacia cuenta bancaria real bajo flujo auditable.

## Principios de armonizacion Usuario + Comercio

- Usuario no cambia de contrato API para explorar cantinas y comprar.
- Comercio usa endpoints administrativos separados y protegidos por rol.
- El catalogo visible en Usuario se alimenta directamente de estados publicados por Comercio.
- Toda venta de cantina queda trazada en ledger para analitica y retiros.
- No se permite mutacion financiera desde frontend sin validacion de backend.

## Decisiones cerradas de identidad y registro (2026-04-02)

- El registro tendra dos nuevos tipos de usuario: `comerciante` y `transportista`.
- Para `comerciante` y `transportista` no se solicitaran campos academicos (facultad, carrera, sede/nucleo).
- En la fase actual, el `comerciante` queda aprobado automaticamente al registrarse.
- En una fase futura se implementara aprobacion administrativa (fuera de alcance actual).
- `comerciante` y `transportista` conservan funciones de usuario general (recargar, enviar/recibir saldo, comprar en cantina/comedor y flujo wallet actual).
- En esta fase cada cuenta tendra un solo rol principal (sin multirol simultaneo).
- El login sigue siendo unico, pero la navegacion post-login debe respetar el contexto de sistema seleccionado (Usuario, Comercio, Transporte).

## Implicaciones tecnicas de las decisiones

- Se debe ampliar whitelist de tipos de usuario en backend para aceptar `comerciante` y `transportista`.
- El formulario de registro debe ser condicional por tipo de usuario.
- Debe existir redireccion por contexto de acceso para evitar enviar siempre al dashboard de Usuario.
- El sistema de aprobaciones administrativas queda como backlog futuro con feature flag.

## Alcance funcional v1 (MVP Comercio)

### Gestion de cantina

- Crear cantina.
- Editar datos basicos.
- Cambiar estado (`open`, `closed`, `inactive`).

### Gestion de menu

- Crear producto.
- Editar producto.
- Activar o desactivar producto.
- Gestionar stock y disponibilidad.

### Operacion basica

- Ver ordenes de la cantina.
- Actualizar estado de orden (`pending`, `preparing`, `ready`, `completed`, `cancelled`).

### Dashboard base

- Ventas brutas y netas por ventana de tiempo.
- Ticket promedio.
- Ordenes totales.
- Clientes unicos.

### Retiros v1

- Registrar cuenta bancaria de comercio.
- Solicitar retiro.
- Ver estados de retiro (`pending`, `approved`, `paid`, `rejected`).

## Contrato funcional v1

### Pantallas iniciales en `/system/comercio`

- Vista Resumen.
- Vista Cantina (datos y estado).
- Vista Menu (CRUD de productos).
- Vista Ordenes.
- Vista Finanzas (metricas + retiros).

### Endpoints nuevos (prefijo sugerido)

Prefijo recomendado: `/api/system/comercio`

- `GET /api/system/comercio/me/cantinas`: lista cantinas del propietario autenticado.
- `POST /api/system/comercio/cantinas`: crea cantina bajo propietario autenticado.
- `PATCH /api/system/comercio/cantinas/:id`: edita datos base y estado de cantina.
- `GET /api/system/comercio/cantinas/:id/products`: lista productos de la cantina.
- `POST /api/system/comercio/cantinas/:id/products`: crea producto de cantina.
- `PATCH /api/system/comercio/products/:id`: edita producto (precio, stock, is_available, is_active).
- `GET /api/system/comercio/cantinas/:id/orders`: lista ordenes de la cantina con filtros por estado y fecha.
- `PATCH /api/system/comercio/orders/:id/status`: actualiza estado de orden.
- `GET /api/system/comercio/cantinas/:id/metrics?range=daily|weekly|monthly|quarterly`: devuelve serie temporal y KPIs resumidos.
- `GET /api/system/comercio/cantinas/:id/wallet`: devuelve bruto, fee, neto, disponible y en proceso.
- `POST /api/system/comercio/cantinas/:id/payout-accounts`: registra o actualiza cuenta bancaria de retiro.
- `POST /api/system/comercio/cantinas/:id/withdrawals`: crea solicitud de retiro.
- `GET /api/system/comercio/cantinas/:id/withdrawals`: lista retiros de la cantina.

### Modelo de datos minimo v1

- `cantina_owners`: `id`, `profile_id`, `cantina_id`, `role`, `is_active`, `created_at`.
- `cantina_ledger`: `id`, `cantina_id`, `order_id`, `entry_type`, `gross_amount`, `fee_amount`, `net_amount`, `currency`, `created_at`.
- `cantina_withdrawal_accounts`: `id`, `cantina_id`, `bank_name`, `account_number_masked`, `account_holder`, `identification`, `is_verified`, `created_at`, `updated_at`.
- `cantina_withdrawals`: `id`, `cantina_id`, `amount`, `status`, `requested_by`, `reviewed_by`, `review_note`, `requested_at`, `reviewed_at`, `paid_at`.
- Extensiones recomendadas en `cantinas`: `owner_profile_id` (si aplica como shortcut), `status`, `opens_at`, `closes_at`, `accepting_orders`.

## Workflow de trabajo (ejecucion por sprints)

### Sprint 9.1 - Hardening de compatibilidad

- Proteger endpoints sensibles de cantina con JWT y ownership.
- Alinear `createOrder` para tomar `user_id` del token cuando aplique.
- Mantener intacta la API publica de exploracion para Usuario.

Criterio de salida:

- Flujo de compra de Usuario no cambia visualmente y tests actuales siguen verdes.

### Sprint 9.2 - Dominio de propietario y cantina

- Crear `cantina_owners` y reglas de ownership.
- Implementar `GET /me/cantinas`.
- Implementar crear y editar cantina en backend.

Criterio de salida:

- Propietario autenticado ve y modifica solo sus cantinas.

### Sprint 9.2B - Registro por rol y acceso por contexto

- Agregar tipos `comerciante` y `transportista` al registro.
- Hacer opcionales/no requeridos campos academicos para esos tipos.
- Mantener capacidades de usuario general para ambos tipos.
- Implementar redireccion post-login por contexto elegido desde landing/modal.

Criterio de salida:

- Un comerciante o transportista puede registrarse e iniciar sesion sin campos academicos.
- El usuario entra al sistema correcto segun contexto seleccionado, sin perder acceso al sistema Usuario.

### Sprint 9.3 - Menu administrativo

- CRUD de productos por cantina con validaciones.
- Publicacion de disponibilidad y stock para Usuario.
- Historial basico de cambios (log interno simple).

Criterio de salida:

- Cambios de menu impactan en tiempo real el catalogo de Usuario.

### Sprint 9.4 - Operacion de ordenes

- Listado de ordenes por cantina.
- Transicion de estados de orden con reglas validas.
- Vista de cola operativa basica en frontend comercio.

Criterio de salida:

- Estado de orden visible y consistente entre Usuario y Comercio.

### Sprint 9.5 - Finanzas y analitica

- Crear `cantina_ledger`.
- Construir KPIs y series por rango (`daily`, `weekly`, `monthly`, `quarterly`).
- Exponer dashboard financiero v1.

Criterio de salida:

- Metrica de ingresos y clientes coherente con ordenes reales.

### Sprint 9.6 - Retiros de fondos v1

- Gestion de cuenta bancaria de retiro.
- Solicitud y listado de retiros.
- Pipeline operativo de aprobacion y pago con estados.

Criterio de salida:

- Comercio puede solicitar retiro con trazabilidad completa.

## Riesgos principales

- Regresion del flujo actual de compra en Usuario.
- Inconsistencia de saldo por falta de ledger formal.
- Endpoints administrativos sin enforcement de ownership.
- Reportes no conciliables si no se normaliza moneda y montos.

## Mitigaciones

- Feature flags por modulo (`comercio_admin_enabled`, `payouts_enabled`).
- Migraciones no destructivas y compatibles hacia atras.
- Validaciones por rol y pruebas de autorizacion.
- Reconciliacion diaria entre ordenes, ledger y retiros.

## KPIs objetivo de Fase 9

- Error rate de compra cantina en Usuario: sin incremento respecto baseline.
- Precision de dashboard comercio vs ordenes: 100% en QA de muestra.
- Cobertura de endpoints administrativos con auth y ownership: 100%.
- Solicitudes de retiro trazables end-to-end: 100%.

## Definicion de terminado (DoD)

- Flujo Usuario estable y sin cambios de contrato publico no versionados.
- Sistema Comercio operativo en `/system/comercio` con CRUD basico y ordenes.
- Dashboard de ingresos y modulo de retiros v1 funcional.
- Documentacion API y README actualizados.
- Validacion tecnica: `npm run check:quick` en frontend y `npm test` en backend en verde.

## Anexos oficiales

- `archive/fase9/FASE9_ANEXO_BACKLOG_EJECUTABLE.md`

## Cierre de fase (2026-04-02)

- Sprint 9.1 a 9.6 implementados en codigo con validacion tecnica en verde (`npm run check:quick` frontend y `npm test` backend).
- Sistema Comercio v1 operativo en `/system/comercio` con gestion de cantinas.
- Sistema Comercio v1 operativo en `/system/comercio` con menu administrativo.
- Sistema Comercio v1 operativo en `/system/comercio` con cola de ordenes y transiciones validas.
- Sistema Comercio v1 operativo en `/system/comercio` con metricas financieras por rango y wallet.
- Sistema Comercio v1 operativo en `/system/comercio` con cuenta bancaria y solicitudes de retiro.
- Recibo de usuario sincroniza estado de orden en frontend (`/services/order`) para mantener coherencia con estados de comercio.

Pendientes fuera de alcance de Fase 9:

- Flujo de aprobacion administrativa para cuentas `comerciante` (roadmap futuro).
- Automatizacion de conciliacion financiera avanzada (fase posterior).
