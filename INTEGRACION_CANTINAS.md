# Integración de Cantinas con Supabase

Una vez que tengas creadas las 4 tablas en Supabase (`cantinas`, `cantina_products`, `cantina_orders`, `cantina_order_items`), los siguientes pasos se dividen en dos frentes: **Backend (API)** y **Frontend (Astro)**.

## 1. Backend: Nuevos Endpoints en tu API (o Edge Functions)

Para que el frontend pueda interactuar con las nuevas tablas de Supabase, necesitarás habilitar/crear endpoints (rutas) en tu backend de Node/Express (o las Supabase Edge Functions que uses).

### a. Obtener todas las cantinas y sus productos (`GET /api/cantinas`)
Debería hacer una consulta a Supabase uniendo las tablas de cantinas y productos.
```javascript
// Lógica esperada en el backend
const { data, error } = await supabase
  .from('cantinas')
  .select(`
    *,
    products:cantina_products(*)
  `);
```

### b. Obtener las Facultades/Áreas (`GET /api/faculties`)
Reutilizar un endpoint que liste las facultades registradas.
```javascript
// Lógica esperada en el backend
const { data, error } = await supabase.from('faculties').select('*');
```

### c. Crear un Pedido / Compra (`POST /api/cantinas/order`)
Recibe el ID del usuario, la cantina, los productos, y calcula los totales.
1. Inserta en `cantina_orders`.
2. Inserta en `cantina_order_items`.
3. Actualiza el perfil del usuario (resta balance, suma `xp`).

---

## 2. Frontend: Modificación en `src/services/api.js`

Agregaremos un nuevo servicio para manejar las cantinas, justo como tienes con el `comedorService`.

```javascript
export const cantinaService = {
  // Obtener áreas / facultades
  getAreas: () => fetchAPI('/faculties'),
  
  // Obtener todas las cantinas con sus productos
  getCantinas: () => fetchAPI('/cantinas'),
  
  // Procesar compra de un snack
  purchaseSnack: (userId, cantinaId, productId, priceBs, priceCapys, xpReward) => 
    fetchAPI('/cantinas/order', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        cantina_id: cantinaId, 
        items: [{ product_id: productId, quantity: 1, price_at_time_bs: priceBs, price_at_time_capys: priceCapys }],
        total_xp: xpReward
      })
    })
};
```

---

## 3. Frontend: Modificar `Cantina.astro` (Nuevos componentes)

El tercer paso (el cual haríamos en conjunto) es ir a tus nuevos componentes Astro (`AreasView.astro`, `CantinasView.astro`, `ProductsView.astro`) y reemplazar el HTML de "datos simulados" por llamadas al `cantinaService` mediante `useEffect` o variables globales en el lado del cliente/servidor.

*Ejemplo de lo que cambiaremos en la vista:*
```javascript
import { cantinaService } from '../../services/api';

// En lugar de usar la constante 'cantinasData' haríamos:
async function cargarDatos() {
  const cantinas = await cantinaService.getCantinas();
  renderAreasList(cantinas);
}
```

---

## ¿Cómo empezamos?
Si tu backend lo manejas **tú por separado**, puedes ir creando los endpoints (rutas `/api/cantinas`) basándote en la parte 1 de este documento.

Si quieres que **yo me encargue del Frontend** de inmediato, el siguiente paso es que yo inserte las modificaciones en `api.js` y remplace los "Mock Data" en tus vistas `.astro` por llamadas reales a tu API (aunque darán error 404 hasta que tu backend esté listo).

¿Qué prefieres hacer primero?
