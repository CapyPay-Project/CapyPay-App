# Fase 10 - Sistema de Transporte y mejoras menores

Fecha de planificacion: 2026-04-02
Estado: DEFINIDA

## Objetivo

Implementar el sistema de Transporte de forma separada del sistema Comercio, y cerrar mejoras menores pendientes que no justifican abrir una fase independiente.

## Contexto de partida

- Fase 9 queda cerrada con Comercio v1, login contextual y sincronizacion del recibo de orden.
- Quedan fuera de alcance de Fase 9 el panel operativo de transporte y ajustes menores de plataforma.
- El login ya soporta contexto de sistema: `usuario`, `comercio` y `transporte`.

## Alcance funcional principal

### Sistema Transporte

- Acceso por rol `transportista`.
- Panel inicial `/system/transporte`.
- Gestion de rutas.
- Gestion de unidades o buses.
- Estado operativo de ruta y unidad.
- Base para metricas operativas futuras.

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
- Crear/estabilizar panel inicial de Transporte.
- Enforce de acceso por rol en frontend y backend.

Criterio de salida:

- Un usuario `transportista` entra al sistema Transporte sin pasar por el dashboard general.

### Sprint 10.2 - Rutas y unidades

- CRUD de rutas de transporte.
- CRUD de unidades o buses.
- Asignacion de unidad a ruta.

Criterio de salida:

- El panel permite crear, editar y desactivar rutas y unidades.

### Sprint 10.3 - Operacion diaria

- Estados de ruta y unidad.
- Disponibilidad y ocupacion basica.
- Vista operativa simple para monitoreo diario.

Criterio de salida:

- El transportista puede marcar estado operativo sin romper el resto del sistema.

### Sprint 10.4 - Cierre de mejoras menores

- Ajustes de UI y responsive.
- Limpieza de textos, labels y ayudas.
- Revisión final de warnings de docs y estilo.

Criterio de salida:

- No quedan warnings nuevos en los archivos tocados y la experiencia queda consistente.

## Riesgos

- Mezclar permisos de Transporte con Usuario general.
- Repetir logica de contexto sin compartir utilidades.
- Sobrecargar la fase con mejoras menores que no sean realmente dependientes.

## Mitigaciones

- Reutilizar el contrato de auth contextual ya resuelto en Fase 9.
- Separar claramente permisos por rol y rutas por sistema.
- Limitar las mejoras menores a correcciones de alto impacto y bajo costo.

## Definicion de terminado

- Panel Transporte operativo y protegido.
- Login contextual funcionando para `transportista`.
- Cambios documentados en el maestro de fase.
- Validacion tecnica verde en lo que toque frontend/backend.

## Fuera de alcance

- Multirol simultaneo.
- Conciliacion financiera avanzada del Comercio.
- Integraciones externas de transporte.
