# components/ui — Referencia rápida

Componentes de interfaz reutilizables. Se exportan todos desde `index.ts`.

---

## Button

**`Button.astro`**  
Botón polimórfico (renderiza `<button>` o `<a>` según si recibe `href`).

| Prop       | Tipo                                    | Default   | Descripción                  |
| ---------- | --------------------------------------- | --------- | ---------------------------- |
| `variant`  | `primary \| secondary \| ghost \| icon` | `primary` | Estilo visual                |
| `size`     | `sm \| md \| lg \| icon`                | `md`      | Tamaño                       |
| `href`     | `string?`                               | —         | Convierte el botón en enlace |
| `disabled` | `boolean`                               | `false`   | Estado deshabilitado         |

Slots: `icon-left`, `icon-right`, default (texto).

---

## Card

**`Card.astro`**  
Contenedor con fondo oscuro, borde sutil y bordes redondeados. Acepta cualquier clase adicional vía `class`.

---

## Input

**`Input.astro`**  
Campo de texto estilizado. Soporta `label`, `error`, `icon` (slot), `type`, y cualquier atributo HTML nativo.

---

## Select

**`Select.astro`**  
Dropdown estilizado. Recibe `options: { value, label }[]`, `label` y acepta atributos HTML nativos.

---

## NivelBadge

**`NivelBadge.astro`**  
Insignia que muestra el nivel del usuario (Novato → Doctorado). Recibe `xp: number` y calcula el nivel internamente.

---

## ToastNotification

**`ToastNotification.astro`**  
Sistema de toasts (notificaciones flotantes temporales). Se monta una sola vez en `MainLayout`.

**Uso desde JS:**

```js
// Llamada directa
window.showToast("Mensaje", "success" | "error" | "info", "Título opcional");

// Vía evento personalizado (útil desde otros módulos)
window.dispatchEvent(
  new CustomEvent("toast", {
    detail: { message: "Mensaje", type: "success", title: "OK" },
  }),
);
```

Los toasts desaparecen solos a los 5 segundos o al pulsar la ×.

**Toasts implementados en la app** _(actualizado 2026-02-26)_:

| Página / Componente   | Evento                                            | Tipo               |
| --------------------- | ------------------------------------------------- | ------------------ |
| `TransferWidget`      | Transferencia realizada con éxito                 | `success`          |
| `TransferWidget`      | Falló la transferencia                            | `error`            |
| `TransferWidget`      | Ingresa la Cédula / monto válido                  | `error`            |
| `BalanceCard`         | PIN incorrecto                                    | `error`            |
| `recarga.astro`       | ¡Recarga Exitosa! 🐹                              | `success`          |
| `recarga.astro`       | Monto inválido / sin referencia                   | `error`            |
| `recarga.astro`       | Error en Recarga                                  | `error`            |
| `recarga.astro`       | Copiado al portapapeles (datos bancarios)         | `success`          |
| `contacts.astro`      | Contacto añadido exitosamente                     | `success`          |
| `contacts.astro`      | Alias actualizado correctamente                   | `success`          |
| `contacts.astro`      | Contacto eliminado                                | `success`          |
| `contacts.astro`      | Añadido / Quitado de favoritos ★                  | `success`          |
| `contacts.astro`      | Errores de API                                    | `error`            |
| `notifications.astro` | Notificaciones eliminadas / marcadas              | `success`          |
| `notifications.astro` | Error al limpiar                                  | `error`            |
| `cantina.astro`       | ¡Compra Exitosa! + XP                             | `success`          |
| `checkout.astro`      | ¡Pago realizado con éxito! + XP                   | `success`          |
| `checkout.astro`      | Error al procesar el pago                         | `error`            |
| `comedorLogic.js`     | ¡Tu pedido del comedor está listo! 🍔             | `success`          |
| `comedorLogic.js`     | Error al cargar menú                              | `error`            |
| `comedorLogic.js`     | No se pudo verificar tus pedidos activos (1 vez)  | `error`            |
| `comedorLogic.js`     | Item agregado al carrito 🍔                       | `success`          |
| `comedorLogic.js`     | ¡Bienvenido! Te avisaremos cuando salga tu pedido | `success`          |
| `comedorLogic.js`     | Gracias por usar CapyPay Comedor 🍔               | `success`          |
| `Sidebar` (polling)   | Pago Recibido / Nueva Notificación                | `success` / `info` |

---

## SkeletonLoader

**`SkeletonLoader.astro`** _(agregado 2026-02-26)_  
Siluetas animadas con efecto shimmer para mostrar mientras carga el contenido o cuando falla la conexión.

| Prop      | Tipo      | Default | Descripción                               |
| --------- | --------- | ------- | ----------------------------------------- |
| `variant` | ver abajo | `card`  | Forma del esqueleto                       |
| `count`   | `number`  | `1`     | Cuántos esqueletos renderizar en lista    |
| `lines`   | `number`  | `2`     | Líneas de texto (solo en `card` y `text`) |
| `class`   | `string`  | `""`    | Clases extra para el wrapper              |

**Variantes disponibles:**

| `variant`        | Para usar en                         |
| ---------------- | ------------------------------------ |
| `card`           | Tarjetas genéricas                   |
| `balance`        | `BalanceCard` mientras carga         |
| `history-item`   | Filas del historial de transacciones |
| `notification`   | Ítems de la página de notificaciones |
| `menu-item`      | Cards de menú del Comedor/Cantina    |
| `profile-header` | Cabecera de perfil de usuario        |
| `text`           | Párrafos de texto                    |

**Ejemplo de uso:**

```astro
---
import { SkeletonLoader } from "../../components/ui";
---

{isLoading && <SkeletonLoader variant="history-item" count={5} />}
{error && <SkeletonLoader variant="history-item" count={3} class="opacity-40" />}
```
