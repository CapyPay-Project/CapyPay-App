# Componentes de Layout

Componentes estructurales que forman el esqueleto de la aplicación. Se usan dentro de `MainLayout.astro`.

---

## Archivos raíz

### `Sidebar.astro`

Barra lateral de navegación para pantallas de escritorio (`lg+`).

- **Estado:** Colapsado (`w-20`) / Expandido (`w-72`), controlado por JS con clases de Tailwind.
- **Sub-componentes:** Delega la mayoría del HTML a la subcarpeta `sidebar/`.
- **Script:** Maneja notificaciones (polling cada 10s), expansión/colapso, carga de contactos rápidos y el menú flotante de contactos.

### `NavBar.astro`

Barra superior fija para dispositivos móviles. Muestra el logo CapyPay y el botón de notificaciones.

### `BottomNav.astro`

Barra de navegación inferior fija para móviles. Contiene accesos rápidos: Dashboard, Contactos, Comedor, Perfil.

---

## Subcarpeta `sidebar/`

Componentes visuales que componen el `Sidebar.astro`. Son **puramente estructurales** (HTML + estilos); el `Sidebar.astro` los llena dinámicamente vía sus IDs desde JavaScript.

### `SidebarProfile.astro`

Sección superior del sidebar: foto de perfil, nombre de usuario y barra de progreso de XP.

**IDs relevantes** (llenados por el script de `Sidebar.astro`):

| ID                      | Contenido                         |
| ----------------------- | --------------------------------- |
| `sidebar-profile-photo` | `src` del `<img>` de perfil       |
| `sidebar-username`      | Nombre del usuario                |
| `sidebar-level-text`    | Texto del nivel (ej. "Nivel 5")   |
| `sidebar-level-xp`      | XP actual                         |
| `sidebar-level-max`     | XP requerido para siguiente nivel |
| `sidebar-level-bar`     | Ancho de la barra de progreso (%) |

---

### `SidebarNavItem.astro`

Elemento de navegación reutilizable. Elimina ~260 líneas de HTML duplicado en el sidebar original.

**Props:**

| Prop          | Tipo      | Requerido | Descripción                                                   |
| ------------- | --------- | --------- | ------------------------------------------------------------- |
| `href`        | `string`  | ✅        | Ruta de destino (ej. `/dashboard`)                            |
| `label`       | `string`  | ✅        | Etiqueta visible del ítem                                     |
| `currentPath` | `string`  | ✅        | `Astro.url.pathname` — determina si el ítem está activo       |
| `title`       | `string`  | ❌        | Tooltip al hacer hover (atributo `title` del botón)           |
| `highlight`   | `boolean` | ❌        | Si `true`, aplica acento lima en lugar del estilo por defecto |
| `badgeIconId` | `string`  | ❌        | ID del icono de badge (ej. campana) para notificaciones       |
| `badgeTextId` | `string`  | ❌        | ID del texto del contador de badge                            |

**Slot:** El ícono SVG se pasa como contenido hijo (`<slot />`).

**Nota:** La detección de ruta activa usa `startsWith(href + "/")` para que subrutas como `/finance/history` activen correctamente el ítem `/finance/history`.

---

### `SidebarFooter.astro`

Sección inferior del sidebar: botón de compartir, enlace a Ajustes y botón de cerrar sesión.

- **Ajustes** → `/account/settings`
- **Logout** → `id="desktop-logout-btn"` (manejado por el script de `Sidebar.astro`)
