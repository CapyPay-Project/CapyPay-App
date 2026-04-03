# Fase 10 - Anexo backlog ejecutable

## Convencion de IDs

- Formato: F10-S{sprint}-{correlativo}
- Ejemplo: F10-S101-001

## Sprint 10.1 - Base de Transporte y acceso interno

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F10-S101-001 | Definir rol interno `staff`/`developer` | P0 | M | capypay-backend/src/controllers/user.controller.js, capypay-backend/src/middleware/auth.js | Allowlist backend para cuentas internas sin rol y sesion con acceso total | DONE |
| F10-S101-002 | Ajustar login contextual para staff | P0 | M | CapyPay-App/src/pages/auth/login.astro, CapyPay-App/src/services/api.js | Cuentas internas no quedan bloqueadas por rol vacio y pueden entrar a todos los sistemas | DONE |
| F10-S101-003 | Enforce de acceso por sistema en Transporte | P0 | S | CapyPay-App/src/pages/system/transporte.astro | El panel solo muestra contenido operativo a transportista o staff | DONE |
| F10-S101-004 | Base visual y navegacion de Transporte | P1 | M | CapyPay-App/src/pages/system/transporte.astro, CapyPay-App/src/styles/landing.css | Landing y sistema transporte con entrypoint estable | DONE |

Criterios de aceptacion Sprint 10.1:

- Las cuentas internas sin rol se migran o mapean a un rol explicito.
- `staff`/`developer` puede entrar a Usuario, Comercio y Transporte.
- El usuario externo sigue con permisos normales por contexto.

## Sprint 10.2 - Rutas, paradas y unidades

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F10-S102-001 | Modelo base de rutas | P0 | L | capypay-backend/src/controllers/transporte.controller.js, capypay-backend/docs/migrations.md | CRUD de rutas con estado `Activa/Saturada/Inactiva` | DONE |
| F10-S102-002 | Gestion de paradas por ruta | P0 | L | capypay-backend/src/controllers/transporte.controller.js, capypay-backend/docs/migrations.md | Crear, ordenar y vincular paradas a rutas | DONE |
| F10-S102-003 | Gestion de unidades/buses | P0 | L | capypay-backend/src/controllers/transporte.controller.js, capypay-backend/docs/migrations.md | CRUD de unidades con estados `vacio/normal/lleno` | DONE |
| F10-S102-004 | Reasignacion de unidad entre rutas | P0 | M | capypay-backend/src/controllers/transporte.controller.js | Cambio auditable de unidad con historial | DONE |

Criterios de aceptacion Sprint 10.2:

- Una ruta puede tener varias paradas ordenadas.
- Una unidad puede ser reasignada sin perder trazabilidad.
- El estado operativo de ruta es consultable desde backend.

## Sprint 10.3 - Integracion TicketBus

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F10-S103-001 | Contrato de lectura para TicketBus | P0 | M | CapyPay-App/src/pages/services/ticketbus.astro, CapyPay-App/src/services/api.js | TicketBus consume rutas, paradas y estados publicados por Transporte | DONE |
| F10-S103-002 | Publicacion de estado de rutas | P0 | M | capypay-backend/src/controllers/transporte.controller.js | Exponer estado operativo para consumo de TicketBus | DONE |
| F10-S103-003 | Publicacion de ocupacion de unidades | P0 | M | capypay-backend/src/controllers/transporte.controller.js | TicketBus puede ver ocupacion y disponibilidad | DONE |
| F10-S103-004 | Sincronizacion de novedades y paradas | P1 | M | CapyPay-App/src/pages/services/ticketbus.astro | UI de usuario refleja cambios operativos de Transporte | DONE |

Criterios de aceptacion Sprint 10.3:

- TicketBus sigue funcionando como flujo de usuario final.
- El usuario ve el estado operativo real sin entrar al panel admin.
- No se duplica logica de negocio entre vistas.

## Sprint 10.4 - Operacion diaria y panel admin

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F10-S104-001 | Panel operativo de rutas | P0 | L | CapyPay-App/src/pages/system/transporte.astro | UI para activar, saturar o inactivar rutas | DONE |
| F10-S104-002 | Panel operativo de paradas | P0 | L | CapyPay-App/src/pages/system/transporte.astro | Alta, edicion, baja logica y orden secuencial | DONE |
| F10-S104-003 | Panel operativo de unidades | P0 | L | CapyPay-App/src/pages/system/transporte.astro | Gestion de buses y reasignacion entre rutas | DONE |
| F10-S104-004 | Auditoria basica de cambios | P1 | M | capypay-backend/src/controllers/transporte.controller.js | Registro de cambios de estado y reasignacion | DONE |

## Sprint 10.5 - QA y mejoras menores

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F10-S105-001 | QA de coexistencia con TicketBus | P0 | M | CapyPay-App/src/pages/services/ticketbus.astro, CapyPay-App/src/pages/system/transporte.astro, CapyPay-App/docs/phases/archive/fase10/FASE10_ANEXO_QA_COEXISTENCIA.md | Validar que ambos sistemas convivan sin regresiones | DONE |
| F10-S105-002 | Ajustes responsive y accesibilidad | P1 | M | CapyPay-App/src/pages/system/transporte.astro, CapyPay-App/src/pages/services/ticketbus.astro | Vista admin usable en desktop y mobile | DONE |
| F10-S105-003 | Limpieza de warnings de docs | P1 | S | CapyPay-App/docs/phases/**, CapyPay-App/docs/product/** | Documentacion sin warnings en archivos tocados | DONE |

## Sprint 10.6 - Cierre final de fase

| ID | Titulo | Prioridad | Estimacion | Archivos objetivo | Entregable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| F10-S106-001 | Pulido final de UI Transporte | P1 | S | CapyPay-App/src/pages/system/transporte.astro | Textos finales, guia operativa y consistencia visual final | DONE |
| F10-S106-002 | Cierre documental de fase | P0 | S | CapyPay-App/docs/phases/FASE10.md, CapyPay-App/docs/phases/README.md | Fase 10 consolidada con anexos y estado de cierre | DONE |
| F10-S106-003 | Evidencia final de salida | P0 | S | CapyPay-App/docs/phases/archive/fase10/FASE10_ANEXO_CIERRE.md | Checklist final de release y riesgos residuales documentados | DONE |

## Dependencias tecnicas

- Sprint 10.1 desbloquea 10.2 y 10.3.
- Sprint 10.2 debe cerrarse antes de integrar TicketBus.
- Sprint 10.3 y 10.4 pueden avanzar en paralelo si el contrato de lectura queda estable.

## Checklist de arranque

- Confirmar contrato de rol interno `staff`/`developer`.
- Definir esquema de rutas, paradas y unidades.
- Crear endpoints de lectura para TicketBus.
- Implementar primer panel operativo de Transporte.
- Ejecutar QA basico de coexistencia.

## Definicion de terminado por ticket

- Contrato funcional documentado.
- Backend y frontend integrados cuando aplique.
- Validacion local ejecutada.
- Estado de ticket actualizado a `DONE` solo con evidencia.
