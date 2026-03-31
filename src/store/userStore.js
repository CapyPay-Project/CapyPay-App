import { atom } from 'nanostores';
import { userService, gamificationService } from '../services/api.js';

// Atom to store the user profile (balance, xp, level, etc.)
export const userProfile = atom({
  balance: 0,
  xp: 0,
  cedula: '',
  name: '',
  level: 1,
  levelName: 'Novato (Cachorro)',
  progress: 0,
  nextXp: 100,
  benefits: { descuento: 0, accesoVIP: false },
  weeklyMissions: [],
  missionSegmentation: {
    userSegment: 'global',
    rulesVersion: 'v1',
    profile: 'weekly_global_v1'
  },
  streakStatus: {
    currentDaily: 0,
    bestDaily: 0,
    currentWeekly: 0,
    weeklyShieldAvailable: 1,
    lastQualifiedAt: null
  },
  gamificationConfig: {},
  isLoading: true
});

// Function to fetch the user profile from the API and update the store
export async function fetchUserProfile() {
  try {
    userProfile.set({ ...userProfile.get(), isLoading: true });

    // 1. Cargar inmediatamente desde localStorage (para que el saldo no se pierda al recargar)
    const savedProfile = localStorage.getItem('capyPayUserProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      userProfile.set({
        balance: Number(parsed.balance ?? 0),
        xp: Number(parsed.xp ?? parsed.puntos ?? 0),
        cedula: parsed.cedula || '',
        name: parsed.nombre || parsed.name || '',
        isLoading: false
      });
    }

    // 2. Llamar a la API (datos del servidor)
    const profile = await userService.getProfile();
    const levelData = await userService.getUserLevel();

    if (profile) {
      const newProfile = {
        balance: Number(profile.balance ?? 0),
        xp: Number(profile.xp ?? profile.puntos ?? 0),
        cedula: profile.cedula || '',
        name: profile.nombre || profile.name || '',
        level: Number(levelData?.level?.id || 1),
        levelName: levelData?.level?.nombre || 'Novato (Cachorro)',
        progress: levelData?.progress || 0,
        nextXp: levelData?.nextXp || 100,
        benefits: levelData?.benefits || { descuento: 0, accesoVIP: false },
        isLoading: false
      };

      // IMPORTANTE: Solo actualizamos el balance desde la API si NO tenemos un cambio reciente guardado
      // (esto evita que la API sobrescriba el saldo después de una compra local)
      const current = userProfile.get();
      userProfile.set({
        ...newProfile,
        balance: current.balance !== 0 ? current.balance : newProfile.balance   // priorizamos el balance local si ya cambió
      });

      // Sincronizamos el localStorage viejo que ya tenías
      const currentUserStr = localStorage.getItem('capypay_user');
      if (currentUserStr) {
        try {
          const storedUser = JSON.parse(currentUserStr);
          storedUser.balance = newProfile.balance;
          storedUser.xp = newProfile.xp;
          localStorage.setItem('capypay_user', JSON.stringify(storedUser));
        } catch (e) {
          console.error('Error synchronizing capypay_user in localStorage', e);
        }
      }

      localStorage.setItem('capypay_user_xp', profile.xp?.toString() || '0');
    } else {
      userProfile.set({ ...userProfile.get(), isLoading: false });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    userProfile.set({ ...userProfile.get(), isLoading: false });
  }
}
// subscribe //
userProfile.subscribe((profile) => {
  if (!profile.isLoading && typeof window !== 'undefined') {
    localStorage.setItem('capyPayUserProfile', JSON.stringify(profile));
  }
});
