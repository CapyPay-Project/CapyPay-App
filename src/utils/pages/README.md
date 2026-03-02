# Controladores de páginas (`utils/pages`)

Este directorio contiene controladores cliente por página para evitar scripts inline extensos en archivos `.astro`.

## Convención

- Cada página exporta un inicializador `init...Page()`.
- Se centralizan referencias DOM, eventos y estado local.
- Se mantiene compatibilidad con handlers inline usando `window.*` cuando es necesario.

## Archivos actuales

- `contactsPage.js`: lógica de contactos (filtros, modal, CRUD, favoritos).
- `historyPage.js`: lógica de historial (carga, filtros, paginación, modal, exportación).
- `profilePage.js`: lógica de perfil (datos usuario, nivel/XP, modales, acciones de seguridad/sesión).
