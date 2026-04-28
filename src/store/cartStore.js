// src/stores/cartStore.js
import { atom, map } from 'nanostores';

export const isCartOpen = atom(false);

const VALID_CONTEXTS = new Set(['comedor', 'cantina']);

function resolveContextType(item = {}) {
  const explicitContext = String(item.contextType || '').trim().toLowerCase();
  if (VALID_CONTEXTS.has(explicitContext)) return explicitContext;

  // Legacy fallback for old saved carts with `type`.
  const legacyType = String(item.type || '').trim().toLowerCase();
  if (VALID_CONTEXTS.has(legacyType)) return legacyType;

  return null;
}

function normalizeSavedCart(rawCart = {}) {
  const normalized = {};
  for (const [id, item] of Object.entries(rawCart || {})) {
    const contextType = resolveContextType(item);
    if (!contextType) continue;

    normalized[id] = {
      ...item,
      contextType,
    };
  }
  return normalized;
}

// Simple persistence manually implemented to avoid extra dependencies
const savedCart = typeof window !== 'undefined' 
  ? normalizeSavedCart(JSON.parse(localStorage.getItem('capy_cart') || '{}')) 
  : {};

export const cartItems = map(savedCart); 

// Subscribe to changes to update localStorage
if (typeof window !== 'undefined') {
  cartItems.subscribe(value => {
    localStorage.setItem('capy_cart', JSON.stringify(value));
  });
}

export function addItemToCart(item) {
  const contextType = resolveContextType(item);
  if (!contextType) {
    throw new Error('contextType inválido. Usa contextType="comedor" o contextType="cantina".');
  }

  const currentItems = cartItems.get();

  const existingItem = currentItems[item.id];

  if (existingItem) {
    cartItems.setKey(item.id, {
      ...existingItem,
      contextType,
      quantity: existingItem.quantity + 1,
    });
  } else {
    cartItems.setKey(item.id, {
      ...item,
      contextType,
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

  if (!VALID_CONTEXTS.has(String(contextType))) {
    throw new Error('contextType inválido en clearCart');
  }

  const currentItems = cartItems.get();
  const retainedItems = {};
  
  for (const key in currentItems) {
    const item = currentItems[key];
    const itemContextType = resolveContextType(item);
    if (!itemContextType) continue;
    
    if (contextType !== itemContextType) {
      retainedItems[key] = {
        ...item,
        contextType: itemContextType,
      };
    }
  }
  
  cartItems.set(retainedItems);
}

