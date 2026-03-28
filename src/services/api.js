// src/services/api.js

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Función genérica para hacer peticiones al backend
 * Maneja automáticamente el token de autenticación si existe
 */
export async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('capypay_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Si el token expiró (401), redirigir al login
    if (response.status === 401) {
      localStorage.removeItem('capypay_token');
      localStorage.removeItem('capypay_user');
      window.location.href = '/auth/login'; 
      return null;
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        // Si la respuesta no es JSON (ej. error 404 HTML del servidor)
        if (!response.ok) {
             throw new Error(`Error ${response.status}: ${response.statusText}`); 
        }
    }
    
    // Si el backend devuelve un error 400-500 y pudimos parsear el JSON
    if (!response.ok) {
      // Buscamos 'message' o 'error' porque tu backend usa ambos
      const mensaje = data?.message || data?.error || 'Error en la petición';
      throw new Error(mensaje);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
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
    if (response.token) {
      localStorage.setItem('capypay_token', response.token);
    }
    
    // IMPORTANTE: Tu backend devuelve 'usuarioId', no 'user' o 'id' suelto
    if (response.usuarioId) {
        // Construimos un objeto de usuario local para guardar
        const userToSave = {
            id: response.usuarioId,
            nombre: response.nombre,
            cedula: response.cedula,
            balance: response.balance,
            xp: response.xp || 0,
            last_login: response.last_login // Nuevo campo
        };
        localStorage.setItem('capypay_user', JSON.stringify(userToSave));
    } else if (response.user || response.usuario || response.id) {
       // Fallback por si cambia la estructura
       const userToSave = response.user || response.usuario || response;
       localStorage.setItem('capypay_user', JSON.stringify(userToSave));
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
        const localUser = JSON.parse(localStorage.getItem('capypay_user') || '{}');
        id = localUser.id;
    }

    if (!id) throw new Error("No hay usuario logueado");

    const response = await fetchAPI(`/usuario/${id}`);
    
    // Actualizar caché local
    if (response) {
        const localUser = JSON.parse(localStorage.getItem('capypay_user') || '{}');
        const updatedUser = { ...localUser, ...response };
        // Aseguramos que XP esté presente si no viene (aunque debería venir)
        if (updatedUser.xp === undefined) updatedUser.xp = 0;
        
        localStorage.setItem('capypay_user', JSON.stringify(updatedUser));
    }
    
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('capypay_token');
    localStorage.removeItem('capypay_user');
    window.location.replace('/auth/login'); // Replace para que no pueda volver atrás
  },

  // Helper para obtener el usuario guardado
  getCurrentUser: () => {
    const user = localStorage.getItem('capypay_user');
    return user ? JSON.parse(user) : null;
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
  
  // Backend route: GET /api/historial
  getHistory: async (cedula) => {
    if (!cedula) {
        const user = authService.getCurrentUser();
        cedula = user?.cedula;
    }
    if (!cedula) throw new Error("Cédula requerida para historial");
    
    return fetchAPI(`/historial?cedula=${cedula}`);
  },

  getContacts: async (userId) => {
     if(!userId) {
         const u = authService.getCurrentUser();
         userId = u?.id;
     }
     if(!userId) return { contactos: [] };
     return fetchAPI(`/contactos?usuario_id=${userId}`);
  },

  addContact: async (cedula, alias) => {
      const u = authService.getCurrentUser();
      if(!u?.id) throw new Error("Usuario no autenticado");
      
      return fetchAPI('/contactos', {
          method: 'POST',
          body: JSON.stringify({
              usuario_id: u.id,
              cedula,
              alias
          })
      });
  },

  deleteContact: async (contactId) => {
      return fetchAPI(`/contactos/${contactId}`, {
          method: 'DELETE'
      });
  },

  searchUsers: async (query) => {
      // ?q=...
      const data = await fetchAPI(`/buscar?q=${query}`);
      return data?.resultados || [];
  },

  toggleFavorite: async (contactId, isFavorite) => {
      return fetchAPI(`/contactos/${contactId}/favorite`, {
          method: 'PUT',
          body: JSON.stringify({ is_favorite: isFavorite })
      });
  },

  updateContact: async (contactId, alias) => {
      return fetchAPI(`/contactos/${contactId}`, {
          method: 'PUT',
          body: JSON.stringify({ alias })
      });
  }
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
    getRanking: (userId) => fetchAPI(`/ranking${userId ? `?user_id=${userId}` : ''}`)
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
