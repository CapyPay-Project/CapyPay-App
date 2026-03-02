# Perfil - Componentes de UI

Este módulo divide la interfaz de `profile.astro` en bloques reutilizables y mantenibles.

## Archivos

- `ProfileHeroCard.astro`: cabecera visual del usuario, nivel, XP e insignias.
- `ProfileInfoCards.astro`: tarjetas de alias, cédula y acceso a QR.
- `ProfileQuickSettingsCard.astro`: ajustes rápidos (incluye acceso a edición).
- `ProfileConfigurationCard.astro`: configuración general, soporte, seguridad y sesión.
- `ProfileModals.astro`: modales de edición, seguridad, FAQ y cierre de sesión.

## Lógica asociada

Toda la lógica cliente se centraliza en:

- `src/utils/pages/profilePage.js`

Este controlador inicializa datos del perfil, actualiza el nivel según XP, expone funciones globales para handlers inline y administra modales.
