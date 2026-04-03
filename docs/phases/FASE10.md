# Fase 10 - Sistema de Transporte y mejoras menores

Fecha de planificacion: 2026-04-02
Estado: CERRADA

## Objetivo

Implementar el sistema de Transporte de forma funcional y coordinada con el sistema TicketBus actual, de forma que ambos coexistan sin duplicar responsabilidades ni romper el flujo del usuario.

## Contexto de partida

- Fase 9 queda cerrada con Comercio v1, login contextual y sincronizacion del recibo de orden.
- Quedan fuera de alcance de Fase 9 el panel operativo de transporte y ajustes menores de plataforma.
- El login ya soporta contexto de sistema: `usuario`, `comercio` y `transporte`.
- TicketBus ya existe como experiencia de uso y debe seguir siendo la capa visible para el usuario final.
- Transporte en Fase 10 debe aportar administracion operativa: rutas, paradas, unidades, estados y reasignacion.

## Acceso interno de desarrollo

- Las cuentas internas que hoy existen sin rol no deben depender de permisos vacios para entrar a los sistemas.
- Se debe introducir un rol explicito de entorno, recomendado `staff` o `developer`, con acceso sin restricciones a todos los sistemas.
- Ese rol debe ser asignado por backend mediante allowlist de cuentas internas o por migracion controlada, no desde el cliente.
- El comportamiento esperado es:
  - acceso a Usuario, Comercio y Transporte sin bloqueo por rol,
  - lectura y uso de todas las vistas operativas,
  - exclusiones solo para acciones sensibles de produccion si luego se decide separarlas por feature flag.
- Las cuentas legacy sin rol deben migrarse a ese rol nuevo para evitar una dependencia permanente de `NULL` como permiso.

## Alcance funcional principal

### Sistema Transporte

- Acceso por rol `transportista`.
- Panel inicial `/system/transporte`.
- Gestion de rutas.
- Gestion de paradas por ruta.
- Gestion de unidades o buses.
- Estado operativo de ruta y unidad.
- Intercambio de unidades entre rutas cuando sea necesario.
- Base para metricas operativas futuras.

### Coexistencia con TicketBus

- TicketBus sigue siendo el flujo de usuario final para consultar, reservar o usar transporte.
- Transporte administra la oferta operativa real: rutas activas, paradas, buses disponibles y estado de saturacion.
- TicketBus consume la informacion publicada por Transporte sin acoplarse al panel administrativo.
- Los cambios operativos en Transporte deben reflejarse en TicketBus sin requerir duplicacion manual.

### Login y navegacion contextual

- Mantener el acceso unico de auth.
- Redireccion por contexto al sistema correcto.
- Evitar fugas al dashboard general cuando el usuario entre por Transporte.

### Mejoras menores

- Pulido visual y responsive de las pantallas nuevas.
- Correcciones puntuales de UX en formularios y estados vacios.
- Limpieza de docs de apoyo si aparecen warnings nuevos.

## Lineas de trabajo por sprint

### Sprint 10.1 - Base de Transporte

- Definir contrato de rol `transportista` en backend y frontend.
- Definir contrato de rol interno `staff`/`developer` para cuentas de desarrollo.
- Crear/estabilizar panel inicial de Transporte.
- Enforce de acceso por rol en frontend y backend.

## Criterio de acceso para cuentas internas

- Si el usuario tiene rol `staff` o `developer`, puede entrar a cualquier sistema sin restriccion funcional.
- Si el usuario no tiene rol asignado pero esta en la allowlist interna, el backend debe mapearlo al rol interno antes de entregar la sesion.
- Si el usuario es externo, se mantiene el control normal por rol y contexto.
- El frontend nunca debe resolver el acceso privilegiado por inspeccion local de `NULL`; la decision debe venir del backend.

Criterio de salida:

- Un usuario `transportista` entra al sistema Transporte sin pasar por el dashboard general.

### Sprint 10.2 - Rutas y unidades

- CRUD de rutas de transporte.
- Estados de ruta: `Activa`, `Saturada`, `Inactiva`.
- Definicion de paradas asociadas a cada ruta.
- Orden secuencial de paradas por ruta.
- CRUD de unidades o buses.
- Asignacion de unidad a ruta.
- Reglas para reasignar una unidad de una ruta a otra.
- Base funcional implementada en backend y panel admin de Transporte.

Criterio de salida:

- El panel permite crear, editar y desactivar rutas, paradas y unidades.
- El sistema soporta reasignacion de buses sin perder trazabilidad.

### Sprint 10.3 - Paradas y estado operativo

- Alta, edicion y baja logica de paradas.
- Vinculo de paradas a una ruta concreta.
- Publicacion del estado de ruta para consumo de TicketBus.
- Transicion de `Activa` a `Saturada` cuando la capacidad supere umbral operativo.
- Integracion funcional implementada entre TicketBus y el feed operativo de Transporte.

Criterio de salida:

- Cada ruta tiene su conjunto de paradas y un estado operativo visible.
- TicketBus puede leer el estado publicado de rutas y presentar la informacion al usuario.

### Sprint 10.4 - Operacion diaria

- Estados de unidad: `vacio`, `normal`, `lleno`.
- Disponibilidad y ocupacion basica.
- Vista operativa simple para monitoreo diario.
- Intercambio de unidad entre rutas con confirmacion y registro historico.
- Implementacion funcional de acciones rapidas de estado y auditoria operativa en panel de Transporte.

Criterio de salida:

- El transportista puede marcar estado operativo y reasignar unidades sin romper el resto del sistema.

### Sprint 10.5 - Integracion con TicketBus

- Consumo del estado de rutas y unidades desde TicketBus.
- Sincronizacion de paradas publicadas con la vista de transporte del usuario.
- Ajustes de UX para que ambos sistemas compartan lenguaje visual y no se perciban como productos aislados.
- QA de coexistencia ejecutado y documentado en anexo dedicado.
- Ajustes de accesibilidad y responsive aplicados en TicketBus y panel de Transporte.

Criterio de salida:

- TicketBus refleja el estado operativo real de Transporte.
- El usuario final ve una experiencia coherente aunque no entre al panel admin.
- Sin warnings nuevos en documentacion tocada durante el sprint.

Evidencia:

- `archive/fase10/FASE10_ANEXO_QA_COEXISTENCIA.md`

### Sprint 10.6 - Cierre de mejoras menores

- Ajustes de UI y responsive.
- Limpieza de textos, labels y ayudas.
- Revisión final de warnings de docs y estilo.
- Cierre documental consolidado con anexos de QA y checklist final.

Criterio de salida:

- No quedan warnings nuevos en los archivos tocados y la experiencia queda consistente.

Evidencia:

- `archive/fase10/FASE10_ANEXO_QA_COEXISTENCIA.md`
- `archive/fase10/FASE10_ANEXO_CIERRE.md`

## Backlog ejecutable

- `archive/fase10/FASE10_ANEXO_BACKLOG_EJECUTABLE.md`

## Riesgos

- Mezclar permisos de Transporte con Usuario general.
- Duplicar logica entre Transporte y TicketBus en vez de compartir contratos.
- Repetir logica de contexto sin compartir utilidades.
- Sobrecargar la fase con mejoras menores que no sean realmente dependientes.
- Desalinear el estado operativo publicado con la experiencia del usuario final.
- Dejar cuentas internas dependiendo de un rol vacio en vez de un rol controlado.

## Mitigaciones

- Reutilizar el contrato de auth contextual ya resuelto en Fase 9.
- Separar claramente permisos por rol y rutas por sistema.
- Definir contratos de lectura para TicketBus y contratos de escritura para Transporte.
- Guardar historial de reasignacion de unidades y cambios de estado para auditoria.
- Limitar las mejoras menores a correcciones de alto impacto y bajo costo.
- Migrar cuentas internas a un rol explicito `staff`/`developer` con allowlist backend.

## Sugerencias de implementacion

- Modelar `rutas`, `paradas`, `ruta_paradas`, `unidades` y `ruta_unidades` con historial de cambios.
- Mantener una sola fuente de verdad para estados publicados de ruta y ocupacion de unidades.
- Usar reasignacion de unidad como operacion auditable, no como cambio silencioso.
- Exponer una vista resumida para TicketBus y una vista detallada para Transporte.
- Considerar un umbral automatico para marcar una ruta como `Saturada` cuando se exceda capacidad o frecuencia objetivo.

## Definicion de terminado

- Panel Transporte operativo y protegido.
- Login contextual funcionando para `transportista`.
- Rutas, paradas y unidades administrables con estados operativos definidos.
- Reasignacion de unidades entre rutas con trazabilidad.
- TicketBus consume la informacion publicada por Transporte.
- Cambios documentados en el maestro de fase.
- Validacion tecnica verde en lo que toque frontend/backend.

## Fuera de alcance

- Multirol simultaneo.
- Conciliacion financiera avanzada del Comercio.
- Integraciones externas de transporte.
