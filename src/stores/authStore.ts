import { STORAGE_KEYS } from '@/utils/storage';
import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string; // Added role
  };
  setUser: (user: { id?: string; name?: string; email?: string; role?: string }) => void;
  login: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: undefined,
  setUser: (user) => set({ user }),
  login: () => set({ isLoggedIn: true }),
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    set({ isLoggedIn: false });
  },
}));

export default useAuthStore;