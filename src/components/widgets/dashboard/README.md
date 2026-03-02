# Dashboard Widgets (Niveles y Balance)

Este README documenta las mejoras aplicadas a `BalanceCard`, `ModuloNiveles` y `NivelBadge` para mantener consistencia visual, accesibilidad y compatibilidad con la rama actual.

## Cambios principales

### 1) BalanceCard (`BalanceCard.astro`) & Carga de Estado

- **NUEVO:** Se implementó `nanostores` a través de `src/store/userStore.js` para crear un estado global del perfil del usuario con la DB.
- **Ventajas:** Múltiples componentes (como `BalanceCard`, `ticketbus`, etc.) pueden consumir y suscribirse al mismo estado global sin hacer decenas de llamadas innecesarias a Supabase.
- Al cargar la página o al emitirse el evento `transaction-completed`, el store actualiza reactivamente el saldo de la tarjeta y su color según el nivel de XP en tiempo real.
- Esto elimina la necesidad de `obtenerXP()` y la escucha rudimentaria de los cambios en el `localStorage` dentro del componente de la tarjeta de balance, eficientizando la UI.
- Se mantiene `id="user-balance-display"` y los manejos de contraste `getContrastColor()`.

### 2) Módulo de niveles (`ModuloNiveles.astro`)

- Se integra `NivelBadge` reutilizable (en vez de markup duplicado).
- Se calcula `nivelInicial` en server-side para evitar salto visual al hidratar.
- Se agrega indicador de porcentaje (`#xp-porcentaje`) junto a la meta del nivel.
- Se añade soporte de accesibilidad en barras de progreso:
  - `role="progressbar"`
  - `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`
- Se añade `@media (prefers-reduced-motion: reduce)` para usuarios con preferencia de menor animación.
- Se mejora contraste dinámico con `getContrastColor()` en badges/estados.

### 3) NivelBadge (`NivelBadge.astro`)

Ahora soporta props opcionales para reuso sin romper implementaciones existentes:

- `id`
- `extraClass`
- `showDetails` (default `false`)

Comportamiento:

- `showDetails=false`: muestra estilo compacto (`"Nivel"`)
- `showDetails=true`: muestra `icono + nombre` con clase `.nivel-text` para scripts que actualizan contenido dinámico.

### 4) Layout (`MainLayout.astro`)

- Se agregó `<meta name="mobile-web-app-capable" content="yes" />` como meta estándar para modo app en Android/Chrome.
- Se conserva la configuración iOS existente (`apple-mobile-web-app-*`).

## Notas de compatibilidad

- Estos cambios están adaptados al estado **actual** de la rama (no al commit antiguo literal).
- Se evitó traer snippets problemáticos del commit original:
  - IDs duplicados en BalanceCard,
  - rutas antiguas (`/niveles` vs `/account/niveles`),
  - overlays de debug invasivos.

## Próximos pasos recomendados

1. Probar Dashboard y Perfil con usuario de cada nivel (novato → doctorado).
2. Validar contraste visual en modo claro/oscuro del sistema.
3. Confirmar que `capypay_user_xp` se sincroniza al cambiar de nivel.
4. Si se desea, extraer utilidades compartidas (`getContrastColor`) a `src/utils/` para no duplicar lógica.
