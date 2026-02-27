# Páginas de Cuenta (`/account`)

Sección de perfil, progresión, contactos y configuraciones del usuario.

---

## `profile.astro`

Perfil del usuario autenticado: foto, nombre, cédula, nivel actual, XP y balance.

- Permite editar la foto de perfil.
- Llama a `api.js → userService.getProfile()` al cargar.

---

## `contacts.astro`

Lista de contactos guardados (beneficiarios para transferencias rápidas).

- Permite agregar y eliminar contactos (por cédula).
- Usa toasts (`window.showToast`) para confirmar acciones.
- Acceso rápido a transferir desde cada contacto.

---

## `notifications.astro`

Centro de notificaciones del usuario.

- Muestra notificaciones no leídas primero.
- Marca como leídas al hacer clic (`notificationsService.markAsRead(id)`).
- El Sidebar ya hace polling cada 10s para el badge; esta página muestra el detalle completo.

---

## `niveles.astro`

Sistema de gamificación del usuario (XP, progreso, beneficios y tareas), usando `ModuloNiveles`.

- Render inicial server-side con `puntosActuales` (`query ?xp=` o fallback seguro).
- Estrategia de datos **SWR manual**:
  - carga instantánea desde `localStorage`;
  - revalidación con servidor vía `authService.getProfile()`;
  - persistencia de XP en `capypay_user_xp` y `capypay_user`.
- Estado visual de sincronización de XP (`#xp-sync-badge`) con feedback de caché/servidor.
- Sincronización entre pestañas con evento `storage`.
- Panel demo disponible solo en `DEV` o con `?demo=1`.

**Rangos de nivel actuales:**

| Nivel | Nombre            | Rango XP       |
| ----- | ----------------- | -------------- |
| 1     | Novato (Cachorro) | 0 - 500        |
| 2     | Bachiller         | 501 - 2,000    |
| 3     | Licenciado        | 2,001 - 5,000  |
| 4     | Magíster          | 5,001 - 10,000 |
| 5     | Doctorado         | 10,001+        |

---

## `ranking.astro`

Tabla de clasificación semanal por XP (Puntos de Influencia).

- **Tabs:** Estudiantes / Facultades
- **Podio:** Top 3 con hexágonos animados y efectos glow.
- **Lista:** Ranks del 4 en adelante, resaltando la fila del usuario actual.
- **Barra de batalla:** Muestra la facultad dominante vs. la segunda (solo en tab de Estudiantes).
- **Footer de progreso:** Posición del usuario y diferencia con su rival directo.
- **Lógica:** Completamente extraída a `src/utils/rankingLogic.js`.

**Bug corregido:** `renderizarFacultades()` ahora protege contra `faculties` nulo/vacío con un null-guard y muestra estado vacío explicativo.

### Dependencias

- `src/utils/rankingLogic.js` → exporta `initRanking()`
- `src/services/api.js` → `rankingService.getRanking(userId)`

---

## `settings.astro`

Configuración de la cuenta: cambio de PIN, preferencias de notificación, apariencia.

- Enlace directo desde `SidebarFooter` y `NavBar`.

---

## Notas generales

- Todas las páginas usan `MainLayout.astro` con `showSidebar={true}`.
- Las acciones sensibles (cambio de PIN, transferencias desde contactos) requieren verificación de PIN.
- Los errores de carga deben mostrarse con `window.showToast(msg, 'error', título)`.
