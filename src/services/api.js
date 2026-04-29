// src/services/api.js

const configuredApiUrl = String(import.meta.env.PUBLIC_API_URL || '').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalhostBrowser = isBrowser && window.location.hostname === 'localhost';

const API_URL = isLocalhostBrowser && (!configuredApiUrl || configuredApiUrl === '/api')
  ? 'http://localhost:3000/api'
  : (configuredApiUrl || (isBrowser ? '/api' : 'http://localhost:3000/api'));

const AUTH_TOKEN_KEY = 'capypay_token';
const AUTH_USER_KEY = 'capypay_user';
const TOKEN_EXP_SKEW_SECONDS = 20;
let authStorageSyncBound = false;
let sessionRefreshBound = false;
let sessionRefreshInFlight = null;
let lastSessionRefreshAt = 0;

function readPublicPositiveNumberEnv(key, fallback) {
  const raw = import.meta.env?.[key];
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

const SESSION_REFRESH_WINDOW_MS = readPublicPositiveNumberEnv('PUBLIC_SESSION_REFRESH_WINDOW_MINUTES', 15) * 60 * 1000;
const SESSION_REFRESH_COOLDOWN_MS = readPublicPositiveNumberEnv('PUBLIC_SESSION_REFRESH_COOLDOWN_SECONDS', 60) * 1000;
const SESSION_REFRESH_POLL_MS = readPublicPositiveNumberEnv('PUBLIC_SESSION_REFRESH_POLL_SECONDS', 60) * 1000;
const SESSION_NOTICE_DELAY_MS = readPublicPositiveNumberEnv('PUBLIC_SESSION_NOTICE_DELAY_MS', 900);

function shouldLogClientErrors() {
  if (!isBrowser) return false;

  const forced = String(import.meta.env.PUBLIC_CLIENT_ERROR_LOGS || '').toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(forced)) return true;

  const disabled = String(import.meta.env.PUBLIC_CLIENT_ERROR_LOGS || '').toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(disabled)) return false;

  return Boolean(import.meta.env.DEV) || window.location.hostname === 'localhost';
}

function emitClientErrorTelemetry(detail = {}) {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent('capypay:client-error', {
    detail: {
      at: new Date().toISOString(),
      ...detail
    }
  }));
}

const gmClientCache = new Map();
const gmClientInflight = new Map();

const GM_CACHE_TTL_MS = {
  weeklyMissions: 15_000,
  weeklySummary: 15_000,
  streak: 20_000,
  publicConfig: 60_000,
  metricsSummary: 30_000
};

function gmGetCache(key) {
  const row = gmClientCache.get(key);
  if (!row) return null;
  return row;
}

function gmSetCache(key, value, ttlMs) {
  const safeTtl = Math.max(1, Number(ttlMs || 1));
  gmClientCache.set(key, {
    value,
    freshUntil: Date.now() + safeTtl,
    updatedAt: Date.now()
  });
}

function buildGmCacheKey(route, userId = 'global') {
  return `gm:${route}:${String(userId || 'global')}`;
}

function withClientCacheMeta(payload, meta = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  return {
    ...payload,
    clientCache: {
      hit: Boolean(meta.hit),
      stale: Boolean(meta.stale),
      key: meta.key || null,
      at: new Date().toISOString()
    }
  };
}

function notifyGmCacheUpdated(key, value) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('capypay-gm-cache-updated', {
    detail: {
      key,
      updatedAt: new Date().toISOString(),
      value
    }
  }));
}

async function gmFetchSWR(key, fetcher, ttlMs) {
  const cached = gmGetCache(key);
  const now = Date.now();

  if (cached && cached.freshUntil > now) {
    return withClientCacheMeta(cached.value, { hit: true, stale: false, key });
  }

  const inflight = gmClientInflight.get(key);
  if (inflight) {
    return inflight;
  }

  const requestPromise = (async () => {
    const fresh = await fetcher();
    gmSetCache(key, fresh, ttlMs);
    notifyGmCacheUpdated(key, fresh);
    return withClientCacheMeta(fresh, { hit: false, stale: false, key });
  })().finally(() => {
    gmClientInflight.delete(key);
  });

  gmClientInflight.set(key, requestPromise);

  if (cached) {
    // SWR: entrega stale rápido y revalida en segundo plano.
    requestPromise.catch(() => {});
    return withClientCacheMeta(cached.value, { hit: true, stale: true, key });
  }

  return requestPromise;
}

function invalidateGamificationClientCache(userId) {
  const safeUserId = String(userId || 'global');
  const keys = [
    buildGmCacheKey('weekly_missions', safeUserId),
    buildGmCacheKey('weekly_summary', safeUserId),
    buildGmCacheKey('streak', safeUserId),
    buildGmCacheKey('metrics_summary', 'global')
  ];
  keys.forEach((key) => {
    gmClientCache.delete(key);
    gmClientInflight.delete(key);
  });
}

function readStorage(key) {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function writeStorage(key, value) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (_error) {
    // Ignorar fallos de storage para no romper la UX.
  }
}

function removeStorage(key) {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (_error) {
    // Ignorar fallos de storage para no romper la UX.
  }
}

function parseJsonSafely(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');

  try {
    const json = atob(padded);
    return parseJsonSafely(json, null);
  } catch (_error) {
    return null;
  }
}

function isTokenExpired(token, skewSeconds = TOKEN_EXP_SKEW_SECONDS) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + Number(skewSeconds || 0);
}

function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return 0;
  return payload.exp * 1000;
}

function shouldRefreshSoon(token) {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return false;
  const remainingMs = expiryMs - Date.now();
  return remainingMs > 0 && remainingMs <= SESSION_REFRESH_WINDOW_MS;
}

function clearAuthSession({ redirect = false, replace = true } = {}) {
  removeStorage(AUTH_TOKEN_KEY);
  removeStorage(AUTH_USER_KEY);

  if (!redirect || !isBrowser) return;

  const currentPath = String(window.location?.pathname || '');
  if (currentPath.startsWith('/auth/login')) return;

  if (replace) {
    window.location.replace('/auth/login');
  } else {
    window.location.href = '/auth/login';
  }
}

function showSessionNotice(message) {
  if (!isBrowser || !message) return;

  const existing = document.getElementById('capypay-session-notice');
  if (existing) existing.remove();

  const node = document.createElement('div');
  node.id = 'capypay-session-notice';
  node.textContent = message;
  node.setAttribute('role', 'status');
  node.style.position = 'fixed';
  node.style.top = '18px';
  node.style.left = '50%';
  node.style.transform = 'translateX(-50%)';
  node.style.zIndex = '99999';
  node.style.padding = '10px 14px';
  node.style.border = '3px solid #292929';
  node.style.borderRadius = '14px';
  node.style.background = '#ffe08a';
  node.style.color = '#1f1f1f';
  node.style.fontFamily = "'Baloo Bhaijaan 2', sans-serif";
  node.style.fontWeight = '800';
  node.style.fontSize = '14px';
  node.style.boxShadow = '5px 5px 0 #292929';
  node.style.opacity = '0';
  node.style.transition = 'opacity 120ms ease';
  document.body.appendChild(node);

  requestAnimationFrame(() => {
    node.style.opacity = '1';
  });
}

function clearAuthSessionWithNotice(message, { replace = true, delayMs = 900 } = {}) {
  clearAuthSession({ redirect: false, replace });

  if (!isBrowser) return;
  showSessionNotice(message);

  window.setTimeout(() => {
    const currentPath = String(window.location?.pathname || '');
    if (currentPath.startsWith('/auth/login')) return;
    if (replace) {
      window.location.replace('/auth/login');
    } else {
      window.location.href = '/auth/login';
    }
  }, delayMs);
}

function bindAuthStorageSync() {
  if (!isBrowser || authStorageSyncBound) return;
  authStorageSyncBound = true;

  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_TOKEN_KEY) return;

    if (!event.newValue) {
      clearAuthSessionWithNotice('La sesion se cerro en otra pestana.', { replace: true, delayMs: Math.min(750, SESSION_NOTICE_DELAY_MS) });
      return;
    }

    if (isTokenExpired(event.newValue)) {
      clearAuthSessionWithNotice('La sesion expiro. Inicia sesion nuevamente.', { replace: true, delayMs: SESSION_NOTICE_DELAY_MS });
    }
  });
}

if (isBrowser) {
  bindAuthStorageSync();
}

async function refreshSessionToken({ force = false } = {}) {
  if (!isBrowser) return null;

  const currentToken = readStorage(AUTH_TOKEN_KEY);
  if (!currentToken || isTokenExpired(currentToken)) return null;

  if (!force && !shouldRefreshSoon(currentToken)) {
    return currentToken;
  }

  if (!force && Date.now() - lastSessionRefreshAt < SESSION_REFRESH_COOLDOWN_MS) {
    return currentToken;
  }

  if (sessionRefreshInFlight) {
    return sessionRefreshInFlight;
  }

  sessionRefreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/session/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          clearAuthSessionWithNotice('Tu sesion ya no es valida. Vuelve a iniciar sesion.', { replace: true, delayMs: 900 });
        }
        return null;
      }

      const payload = await response.json().catch(() => null);
      const refreshedToken = payload?.token;

      if (!refreshedToken || isTokenExpired(refreshedToken, 0)) {
        clearAuthSessionWithNotice('No se pudo renovar la sesion. Inicia sesion nuevamente.', { replace: true, delayMs: SESSION_NOTICE_DELAY_MS });
        return null;
      }

      writeStorage(AUTH_TOKEN_KEY, refreshedToken);
      lastSessionRefreshAt = Date.now();
      return refreshedToken;
    } catch (_error) {
      return currentToken;
    } finally {
      sessionRefreshInFlight = null;
    }
  })();

  return sessionRefreshInFlight;
}

function bindSessionAutoRefresh() {
  if (!isBrowser || sessionRefreshBound) return;
  sessionRefreshBound = true;

  const runRefreshCheck = () => {
    refreshSessionToken({ force: false }).catch(() => null);
  };

  window.setInterval(runRefreshCheck, SESSION_REFRESH_POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runRefreshCheck();
  });
  window.addEventListener('focus', runRefreshCheck);

  runRefreshCheck();
}

if (isBrowser) {
  bindSessionAutoRefresh();
}

function getValidToken() {
  const token = readStorage(AUTH_TOKEN_KEY);
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearAuthSessionWithNotice('La sesion expiro. Inicia sesion nuevamente.', { replace: true, delayMs: SESSION_NOTICE_DELAY_MS });
    return null;
  }

  if (shouldRefreshSoon(token)) {
    refreshSessionToken({ force: false }).catch(() => null);
  }

  return token;
}

/**
 * Función genérica para hacer peticiones al backend
 * Maneja automáticamente el token de autenticación si existe
 */
export async function fetchAPI(endpoint, options = {}) {
  const token = getValidToken();

  const method = String(options.method || 'GET').toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null && method !== 'GET' && method !== 'HEAD';

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
  if (hasBody && !hasContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    let data;
    try {
        data = await response.json();
    } catch (error) {
        // Si la respuesta no es JSON (ej. error 404 HTML del servidor)
        if (!response.ok) {
             throw new Error(`Error ${response.status}: ${response.statusText}`); 
        }
    }
    
    // Tratar respuestas de auth invalida sin propagar ruido al resto de la UI.
    if (response.status === 401) {
      clearAuthSessionWithNotice('Tu sesion ya no es valida. Vuelve a iniciar sesion.', { replace: true, delayMs: SESSION_NOTICE_DELAY_MS });
      return null;
    }

    if (response.status === 403) {
      const rawMessage = String(data?.message || data?.error || '').toLowerCase();
      const looksLikeAuthError = rawMessage.includes('token');
      if (looksLikeAuthError) {
        clearAuthSessionWithNotice('Tu sesion ya no es valida. Vuelve a iniciar sesion.', { replace: true, delayMs: SESSION_NOTICE_DELAY_MS });
        return null;
      }
    }

    // Si el backend devuelve un error 400-500 y pudimos parsear el JSON
    if (!response.ok) {
      // Buscamos 'message' o 'error' porque tu backend usa ambos
      const mensaje = data?.message || data?.error || 'Error en la petición';
      const requestError = new Error(mensaje);
      requestError.status = response.status;
      requestError.endpoint = endpoint;
      requestError.method = method;
      requestError.responseData = data;
      throw requestError;
    }

    return data;
  } catch (error) {
    const isNetworkError = error instanceof TypeError;
    if (isNetworkError) {
      error.isNetworkError = true;
    }

    const debugApi = typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('debugApi') === '1' || window.__CAPYPAY_DEBUG_API__ === true);

    const shouldLog = shouldLogClientErrors() || debugApi;

    if (shouldLog) {
      console.error('[CapyPay API Error]', {
        endpoint,
        method,
        status: Number(error?.status || 0) || null,
        message: error?.message || 'Unknown error',
        isNetworkError,
        at: new Date().toISOString()
      });
    }

    emitClientErrorTelemetry({
      source: 'fetchAPI',
      endpoint,
      method,
      status: Number(error?.status || 0) || null,
      message: error?.message || 'Unknown error',
      isNetworkError
    });

    if (debugApi) {
      console.error('API Error detail:', error);
    }

    throw error;
  }
}

// Servicios de Autenticación
export const authService = {
  login: async (email, password) => {
    // Backend route: POST /api/login
    const response = await fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Guardamos el token y el usuario si el login es exitoso
    // Asumimos que la respuesta trae { token, user: { id, ... } }
    if (!response?.token) {
      throw new Error('Respuesta de login invalida: token ausente');
    }

    if (isTokenExpired(response.token, 0)) {
      throw new Error('Token recibido invalido o expirado');
    }

    writeStorage(AUTH_TOKEN_KEY, response.token);
    
    // IMPORTANTE: Tu backend devuelve 'usuarioId', no 'user' o 'id' suelto
    if (response.usuarioId) {
        // Construimos un objeto de usuario local para guardar
        const userToSave = {
            id: response.usuarioId,
            nombre: response.nombre,
            cedula: response.cedula,
            tipo: response.tipo || response.user_type || null,
            user_type: response.user_type || response.tipo || null,
            balance: response.balance,
            xp: response.xp || 0,
          avatar_url: response.avatar_url || null,
            last_login: response.last_login // Nuevo campo
        };
          writeStorage(AUTH_USER_KEY, JSON.stringify(userToSave));
    } else if (response.user || response.usuario || response.id) {
       // Fallback por si cambia la estructura
       const userToSave = response.user || response.usuario || response;
         writeStorage(AUTH_USER_KEY, JSON.stringify(userToSave));
    }
    
    return response;
  },
  
  register: async (userData) => {
    // Backend route: POST /api/registro
    return fetchAPI('/registro', {
      method: 'POST',
      body: JSON.stringify(userData), // nombre, email, password, etc.
    });
  },

  getProfile: async (userId) => {
    // Si no se pasa userId, intentar leer del localStorage
    let id = userId;
    if (!id) {
      const localUser = parseJsonSafely(readStorage(AUTH_USER_KEY), {});
        id = localUser.id;
    }

    if (!id) throw new Error("No hay usuario logueado");

    const response = await fetchAPI(`/usuario/${id}`);
    
    // Actualizar caché local
    if (response) {
      const localUser = parseJsonSafely(readStorage(AUTH_USER_KEY), {});
        const updatedUser = { ...localUser, ...response };
        // Aseguramos que XP esté presente si no viene (aunque debería venir)
        if (updatedUser.xp === undefined) updatedUser.xp = 0;
        
      writeStorage(AUTH_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return response;
  },
  
  logout: () => {
    clearAuthSession({ redirect: true, replace: true }); // Replace para que no pueda volver atrás
  },

  // Helper para obtener el usuario guardado
  getCurrentUser: () => {
    const token = getValidToken();
    if (!token) return null;

    const user = parseJsonSafely(readStorage(AUTH_USER_KEY), null);
    if (!user || typeof user !== 'object') {
      clearAuthSession({ redirect: true, replace: true });
      return null;
    }

      if (!user.user_type && user.tipo) {
        user.user_type = user.tipo;
      }

    return user;
  }
};

// Servicios de Usuario y Transacciones
export const userService = {
  // Backend route: GET /api/usuario/:id
  getProfile: async (id) => {
    // Si no pasan ID, intentamos obtenerlo del storage
    let userId = id;
    if (!userId) {
       const storedUser = authService.getCurrentUser();
       userId = storedUser?.id || storedUser?.user_id;
    }
    
    if (!userId) throw new Error("ID de usuario no encontrado");
    
    return fetchAPI(`/usuario/${userId}`);
  },
  
  // Backend route: GET /api/usuario/:id/level
  getUserLevel: async (id) => {
    let userId = id;
    if (!userId) {
       const storedUser = authService.getCurrentUser();
       userId = storedUser?.id || storedUser?.user_id;
    }
    if (!userId) throw new Error("ID de usuario no encontrado");
    
    return fetchAPI(`/usuario/${userId}/level`);
  },
  
  // Backend route: GET /api/historial
  getHistory: async (cedulaOrParams) => {
    const params = typeof cedulaOrParams === 'object' && cedulaOrParams !== null
      ? cedulaOrParams
      : { cedula: cedulaOrParams };

    if (!params.cedula && !params.userId) {
      const user = authService.getCurrentUser();
      params.cedula = user?.cedula || params.cedula;
      params.userId = user?.id || params.userId;
    }

    if (!params.cedula && !params.userId) throw new Error("Cédula o usuario requerido para historial");

    const query = new URLSearchParams();
    if (params.cedula) query.set('cedula', params.cedula);
    if (params.userId) query.set('userId', params.userId);

    return fetchAPI(`/historial?${query.toString()}`);
  },

  searchUsers: async (query) => {
      // ?q=...
      const data = await fetchAPI(`/buscar?q=${query}`);
      return data?.resultados || [];
  },

  updateAvatar: async (userId, avatarUrl) => {
      let id = userId;
      if (!id) {
        const storedUser = authService.getCurrentUser();
        id = storedUser?.id || storedUser?.user_id;
      }
      if (!id) throw new Error("ID de usuario no encontrado");

      return fetchAPI(`/usuario/${id}/avatar`, {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: avatarUrl || "" })
      });
  },

  updatePin: async (pin, userId) => {
      let id = userId;
      if (!id) {
        const storedUser = authService.getCurrentUser();
        id = storedUser?.id || storedUser?.user_id;
      }
      if (!id) throw new Error("ID de usuario no encontrado");

      return fetchAPI(`/usuario/${id}/pin`, {
        method: 'PUT',
        body: JSON.stringify({ pin: String(pin || '').trim() })
      });
  }
};

export const contactService = {
  getContacts: async (userId) => {
    const currentUser = authService.getCurrentUser();
    const safeId = userId || currentUser?.id;
    if (!safeId) throw new Error('ID de usuario no encontrado');
    const data = await fetchAPI(`/contactos?usuario_id=${safeId}`);
    return data?.contactos || [];
  },

  addContact: async ({ contactId, cedula, alias, userId }) => {
    const currentUser = authService.getCurrentUser();
    const safeId = userId || currentUser?.id;
    if (!safeId) throw new Error('ID de usuario no encontrado');

    const payload = {
      usuario_id: safeId,
      alias: alias || undefined,
    };

    if (contactId) payload.contact_id = contactId;
    if (cedula) payload.cedula = cedula;

    return fetchAPI('/contactos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  toggleFavorite: async (contactRelationId, isFavorite) => {
    return fetchAPI(`/contactos/${contactRelationId}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ is_favorite: Boolean(isFavorite) }),
    });
  },

  updateAlias: async (contactRelationId, alias) => {
    return fetchAPI(`/contactos/${contactRelationId}`, {
      method: 'PUT',
      body: JSON.stringify({ alias }),
    });
  },

  removeContact: async (contactRelationId) => {
    return fetchAPI(`/contactos/${contactRelationId}`, {
      method: 'DELETE',
    });
  },
};

export const comedorService = {
  getMenu: () => fetchAPI('/comedor/menu'),
  getStats: () => fetchAPI('/comedor/stats'),
  createOrder: (userId, items) => fetchAPI('/comedor/order', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, items })
  }),
  getOrder: (id) => fetchAPI(`/comedor/order/${id}`),
  getMyOrders: (userId) => fetchAPI(`/comedor/my-orders/${userId}`)
};

export const rankingService = {
    getRanking: (userId) => fetchAPI(`/ranking${userId && userId !== 'null' ? `?user_id=${userId}` : ''}`)
};

export const transactionService = {
  // Backend route: POST /api/recargar
  recharge: async (data) => {
     return fetchAPI('/recargar', {
        method: 'POST',
        body: JSON.stringify(data) 
     });
  },
  
  // Backend route: POST /api/transferir
  transfer: async (data) => {
      return fetchAPI('/transferir', {
          method: 'POST',
          body: JSON.stringify(data)
      });
  },
  
  // Backend route: GET /api/tasa
  getRate: async () => {
      return fetchAPI('/tasa');
  }
};

export const notificationService = {
  getNotifications: async (userId) => {
    if(!userId) {
       const u = authService.getCurrentUser();
       userId = u?.id;
    }
    if(!userId) return { notifications: [] };
    return fetchAPI(`/notifications/${userId}`);
  },

  markAsRead: async (notifId) => {
    return fetchAPI(`/notifications/${notifId}/read`, {
       method: 'PATCH'
    });
  },

  clearAll: async (userId) => {
    if(!userId) {
       const u = authService.getCurrentUser();
       userId = u?.id;
    }
    if(!userId) return { success: false };
    return fetchAPI(`/notifications/${userId}/clear`, {
       method: 'DELETE'
    });
  }
};

export const missionService = {
  getAllMissions: async () => fetchAPI('/missions'),
  getUserMissions: async (userId) => fetchAPI(`/missions/user/${userId}`),
  completeMission: async (missionCode, userId) => fetchAPI('/missions/complete', {
    method: 'POST',
    body: JSON.stringify({ missionCode, userId })
  })
};

export const gamificationService = {
  buyShopItem: async (itemId, userId) => { return fetchAPI('/gamification/shop/buy', { method: 'POST', body: JSON.stringify({ itemId, userId }) }); },
    getShopItems: async () => {
    return fetchAPI('/gamification/shop/items');
  },
  
  getEventMissions: async (userId) => {
    if (!userId) { const u = authService.getCurrentUser(); userId = u?.id; }
    if (!userId) return [];
    return fetchAPI('/gamification/missions/event?userId='+userId);
  },

  getWeeklyMissions: async (userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const key = buildGmCacheKey('weekly_missions', userId);
    return gmFetchSWR(
      key,
      () => fetchAPI(`/gamification/missions/weekly?userId=${userId}`),
      GM_CACHE_TTL_MS.weeklyMissions
    );
  },

  getWeeklySummary: async (userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const key = buildGmCacheKey('weekly_summary', userId);
    return gmFetchSWR(
      key,
      () => fetchAPI(`/gamification/summary/weekly?userId=${userId}`),
      GM_CACHE_TTL_MS.weeklySummary
    );
  },

  getStreak: async (userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const key = buildGmCacheKey('streak', userId);
    return gmFetchSWR(
      key,
      () => fetchAPI(`/gamification/streak?userId=${userId}`),
      GM_CACHE_TTL_MS.streak
    );
  },

  claimMission: async (missionId, userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const result = await fetchAPI(`/gamification/missions/${missionId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    invalidateGamificationClientCache(userId);
    return result;
  },

  progressMission: async (missionId, userId, increment = 1) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const result = await fetchAPI(`/gamification/missions/${missionId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ userId, increment })
    });
    invalidateGamificationClientCache(userId);
    return result;
  },

  getRewards: async (userId, status) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const statusParam = status ? `&status=${encodeURIComponent(status)}` : '';
    return fetchAPI(`/gamification/rewards?userId=${userId}${statusParam}`);
  },

  claimReward: async (rewardId, userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    const result = await fetchAPI(`/gamification/rewards/${rewardId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    invalidateGamificationClientCache(userId);
    return result;
  },

  getPublicConfig: async () => {
    const key = buildGmCacheKey('public_config', 'global');
    return gmFetchSWR(
      key,
      () => fetchAPI('/gamification/config/public'),
      GM_CACHE_TTL_MS.publicConfig
    );
  },

  getMetricsSummary: async () => {
    const key = buildGmCacheKey('metrics_summary', 'global');
    return gmFetchSWR(
      key,
      () => fetchAPI('/gamification/metrics/summary'),
      GM_CACHE_TTL_MS.metricsSummary
    );
  },

  getBadgesSync: async (userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    return fetchAPI(`/gamification/badges/sync?userId=${encodeURIComponent(userId)}`);
  },

  saveBadgesSync: async ({ userId, badges }) => {
    let safeUserId = userId;
    if (!safeUserId) {
      const u = authService.getCurrentUser();
      safeUserId = u?.id;
    }
    if (!safeUserId) throw new Error('ID de usuario no encontrado');

    return fetchAPI('/gamification/badges/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId: safeUserId,
        badges: badges || {}
      })
    });
  },

  invalidateClientCache: (userId) => {
    invalidateGamificationClientCache(userId);
    return { invalidated: true };
  },

  getClientCacheStats: () => ({
    cacheKeys: gmClientCache.size,
    inflightKeys: gmClientInflight.size
  }),

  assignExperimentVariant: async (experimentKey, userId) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');
    if (!experimentKey) throw new Error('experimentKey es requerido');

    return fetchAPI(
      `/gamification/experiments/assign?userId=${encodeURIComponent(userId)}&experimentKey=${encodeURIComponent(experimentKey)}`
    );
  },

  trackExperimentEvent: async ({ experimentKey, variant, eventType, payload = {}, userId }) => {
    if (!userId) {
      const u = authService.getCurrentUser();
      userId = u?.id;
    }
    if (!userId) throw new Error('ID de usuario no encontrado');

    return fetchAPI('/gamification/experiments/track', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        experimentKey,
        variant,
        eventType,
        payload
      })
    });
  }
};

// Servicio de PIN para validación
export const pinService = {
  verify: async (pin) => {
    const user = authService.getCurrentUser();
    if(!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.id || user.usuarioId || user._id;

    // Llamamos al backend para validar el PIN
    // Asumiendo que el backend tiene un endpoint para validar PIN
    return fetchAPI(`/verify-pin`, {
      method: 'POST',
      body: JSON.stringify({ userId, pin })
    });
  }
};


export const cantinaService = {
  // Backend route: GET /api/cantinas/order/:id
  getOrder: (orderId) => fetchAPI(`/cantinas/order/${orderId}`),

  // Backend route: GET /api/cantinas/orders/:userId
  getUserOrders: (userId) => fetchAPI(`/cantinas/orders/${userId}`),

  // Backend route: GET /api/cantinas/faculties
  getAreas: () => fetchAPI('/cantinas/faculties'),
  
  // Backend route: GET /api/cantinas
  getCantinas: () => fetchAPI('/cantinas'),
  
  purchaseProducts: (userId, cantinaId, products, totalBs, totalCapys, totalXp) => {
    // Backend expects items as [{ product_id, quantity }]
    const formattedItems = products.map(p => ({
      product_id: p.product_id || p.id,
      quantity: p.quantity || 1
    }));
    
    return fetchAPI('/cantinas/order', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        cantina_id: cantinaId,
        items: formattedItems, 
        total_bs: totalBs,
        total_capys: totalCapys,
        total_xp: totalXp
      })
    });
  }
};

export const comercioSystemService = {
  getMyCantinas: () => fetchAPI('/system/comercio/me/cantinas'),

  createCantina: (payload) => fetchAPI('/system/comercio/cantinas', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateCantina: (cantinaId, payload) => fetchAPI(`/system/comercio/cantinas/${cantinaId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getCantinaProducts: (cantinaId) => fetchAPI(`/system/comercio/cantinas/${cantinaId}/products`),

  createCantinaProduct: (cantinaId, payload) => fetchAPI(`/system/comercio/cantinas/${cantinaId}/products`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateCantinaProduct: (productId, payload) => fetchAPI(`/system/comercio/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getCantinaOrders: (cantinaId, status = '') => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchAPI(`/system/comercio/cantinas/${cantinaId}/orders${q}`);
  },

  updateCantinaOrderStatus: (orderId, status) => fetchAPI(`/system/comercio/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  getCantinaMetrics: (cantinaId, range = 'weekly') =>
    fetchAPI(`/system/comercio/cantinas/${cantinaId}/metrics?range=${encodeURIComponent(range)}`),

  getCantinaWallet: (cantinaId) =>
    fetchAPI(`/system/comercio/cantinas/${cantinaId}/wallet`),

  getPayoutAccount: (cantinaId) =>
    fetchAPI(`/system/comercio/cantinas/${cantinaId}/payout-accounts`),

  upsertPayoutAccount: (cantinaId, payload) => fetchAPI(`/system/comercio/cantinas/${cantinaId}/payout-accounts`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  createWithdrawal: (cantinaId, amount) => fetchAPI(`/system/comercio/cantinas/${cantinaId}/withdrawals`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  }),

  getWithdrawals: (cantinaId) =>
    fetchAPI(`/system/comercio/cantinas/${cantinaId}/withdrawals`)
};

export const transporteSystemService = {
  getPublicOverview: () => fetchAPI('/system/transporte/public/overview'),

  getDashboard: () => fetchAPI('/system/transporte/dashboard'),

  getOperationalAudit: () => fetchAPI('/system/transporte/audit'),

  getRoutes: () => fetchAPI('/system/transporte/routes'),

  createRoute: (payload) => fetchAPI('/system/transporte/routes', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateRoute: (routeId, payload) => fetchAPI(`/system/transporte/routes/${routeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  updateRouteStatus: (routeId, status, active) => fetchAPI(`/system/transporte/routes/${routeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, active })
  }),

  addStopToRoute: (routeId, payload) => fetchAPI(`/system/transporte/routes/${routeId}/stops`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  removeStopFromRoute: (routeId, stopId) => fetchAPI(`/system/transporte/routes/${routeId}/stops/${stopId}`, {
    method: 'DELETE'
  }),

  getStops: () => fetchAPI('/system/transporte/stops'),

  createStop: (payload) => fetchAPI('/system/transporte/stops', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateStop: (stopId, payload) => fetchAPI(`/system/transporte/stops/${stopId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  updateStopStatus: (stopId, status, active) => fetchAPI(`/system/transporte/stops/${stopId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, active })
  }),

  getUnits: () => fetchAPI('/system/transporte/units'),

  createUnit: (payload) => fetchAPI('/system/transporte/units', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateUnit: (unitId, payload) => fetchAPI(`/system/transporte/units/${unitId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  updateUnitStatus: (unitId, status, active, occupancy) => fetchAPI(`/system/transporte/units/${unitId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, active, occupancy })
  }),

  assignUnitToRoute: (unitId, payload) => fetchAPI(`/system/transporte/units/${unitId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getAssignments: () => fetchAPI('/system/transporte/assignments')
};
