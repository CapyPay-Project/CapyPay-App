// src/stores/cartStore.js
import { atom, map } from 'nanostores';

export const isCartOpen = atom(false);

// Simple persistence manually implemented to avoid extra dependencies
const savedCart = typeof window !== 'undefined' 
  ? JSON.parse(localStorage.getItem('capy_cart') || '{}') 
  : {};

export const cartItems = map(savedCart); 

// Subscribe to changes to update localStorage
if (typeof window !== 'undefined') {
  cartItems.subscribe(value => {
    localStorage.setItem('capy_cart', JSON.stringify(value));
  });
}

export function addItemToCart(item) {
  const currentItems = cartItems.get();

  const existingItem = currentItems[item.id];

  if (existingItem) {
    cartItems.setKey(item.id, {
      ...existingItem,
      quantity: existingItem.quantity + 1,
    });
  } else {
    cartItems.setKey(item.id, {
      ...item,
      quantity: 1,
    });
  }
  return { success: true };
}

export function removeItemFromCart(itemId) {
  const currentItems = cartItems.get();
  const existingItem = currentItems[itemId];

  if (existingItem && existingItem.quantity > 1) {
    cartItems.setKey(itemId, {
      ...existingItem,
      quantity: existingItem.quantity - 1,
    });
  } else {
    const { [itemId]: _, ...rest } = currentItems;
    cartItems.set(rest);
  }
}

export function clearCart(contextType) {
  if (!contextType) {
    cartItems.set({});
    return;
  }

  const currentItems = cartItems.get();
  const retainedItems = {};
  
  for (const key in currentItems) {
    const item = currentItems[key];
    const isCantinaItem = item.type === 'cantina' || (item.id.toString().includes('-') && item.id.toString().length > 10);
    
    if (contextType === 'cantina' && !isCantinaItem) {
      retainedItems[key] = item; // Keep Comedor items
    } else if (contextType === 'comedor' && isCantinaItem) {
      retainedItems[key] = item; // Keep Cantina items
    }
  }
  
  cartItems.set(retainedItems);
}

