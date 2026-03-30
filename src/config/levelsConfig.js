// src/config/levelsConfig.js

// Configuración centralizada de niveles
export const levels = [
  {
    id: 1,
    nombre: 'Novato (Cachorro)',
    puntosMin: 0,
    puntosMax: 500,
    color: '#9CA3AF',
    colorGlow: '#6B7280',
    beneficios: { descuento: 0, accesoVIP: false }
  },
  {
    id: 2,
    nombre: 'Bachiller',
    puntosMin: 501,
    puntosMax: 2000,
    color: '#60A5FA',
    colorGlow: '#3B82F6',
    beneficios: { descuento: 0.05, accesoVIP: false } // 5% descuento
  },
  {
    id: 3,
    nombre: 'Licenciado',
    puntosMin: 2001,
    puntosMax: 5000,
    color: '#A78BFA',
    colorGlow: '#8B5CF6',
    beneficios: { descuento: 0.1, accesoVIP: false } // 10% descuento
  },
  {
    id: 4,
    nombre: 'Magíster',
    puntosMin: 5001,
    puntosMax: 10000,
    color: '#34D399',
    colorGlow: '#10B981',
    beneficios: { descuento: 0.15, accesoVIP: true } // 15% descuento + VIP
  },
  {
    id: 5,
    nombre: 'Doctor',
    puntosMin: 10001,
    puntosMax: 20000,
    color: '#F59E0B',
    colorGlow: '#D97706',
    beneficios: { descuento: 0.2, accesoVIP: true } // 20% descuento + VIP
  },
  {
    id: 6,
    nombre: 'Capy Legend',
    puntosMin: 20001,
    puntosMax: Infinity,
    color: '#F472B6',
    colorGlow: '#EC4899',
    beneficios: { descuento: 0.25, accesoVIP: true } // 25% descuento + VIP
  }
];

// Función para calcular nivel basado en XP
export function calculateLevel(xp) {
  if (xp < 0) return null; // Validación básica

  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    if (xp >= level.puntosMin) {
      const progress = Math.min(100, ((xp - level.puntosMin) / (level.puntosMax - level.puntosMin)) * 100);
      const nextXp = level.puntosMax === Infinity ? null : level.puntosMax - xp;
      return {
        ...level,
        progress: Math.round(progress),
        nextXp: nextXp > 0 ? nextXp : 0,
        isMaxLevel: level.puntosMax === Infinity
      };
    }
  }
  return null; // XP insuficiente para cualquier nivel
}