import { atom } from 'nanostores';
import { userService } from '../services/api.js';

// Atom to store the user profile (balance, xp, level, etc.)
export const userProfile = atom({
  balance: 0,
  xp: 0,
  cedula: '',
  name: '',
  isLoading: true
});

// Function to fetch the user profile from the API and update the store
export async function fetchUserProfile() {
  try {
    userProfile.set({ ...userProfile.get(), isLoading: true });
    
    // Call API using the service
    const profile = await userService.getProfile();
    
    if (profile) {
      userProfile.set({
        balance: Number(profile.balance ?? 0),
        xp: Number(profile.xp ?? profile.puntos ?? 0),
        cedula: profile.cedula || '',
        name: profile.nombre || profile.name || '',
        isLoading: false
      });
      
      // Keep localStorage in sync just in case other parts of the old app still read it directly
      const currentUserStr = localStorage.getItem('capypay_user');
      if (currentUserStr) {
        try {
          const storedUser = JSON.parse(currentUserStr);
          storedUser.balance = profile.balance;
          storedUser.xp = profile.xp;
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

// Auto-refresh when a transaction is completed across the app
if (typeof window !== 'undefined') {
  window.addEventListener("transaction-completed", fetchUserProfile);
}
