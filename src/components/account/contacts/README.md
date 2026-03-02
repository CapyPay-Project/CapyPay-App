# Contactos - Componentes de UI

Este módulo agrupa la interfaz de la página de contactos.

## Archivos

- `ContactsHeader.astro`: encabezado principal de la vista.
- `ContactsFilters.astro`: buscador y filtros (todos/favoritos).
- `ContactsGrid.astro`: contenedor donde se renderizan las tarjetas dinámicas.
- `ContactsModal.astro`: modal para crear/editar contactos.

## Lógica asociada

La interacción está centralizada en:

- `src/utils/pages/contactsPage.js`

Ese archivo maneja eventos, render dinámico, sugerencias de cédula y operaciones CRUD con `userService`.
