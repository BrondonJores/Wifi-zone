import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  selectedRouterId: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (val: boolean) => void;
  setSelectedRouterId: (id: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      selectedRouterId: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (val) => set({ isAuthenticated: val }),
      setSelectedRouterId: (id) => set({ selectedRouterId: id }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'wifi-saas-auth', // Clé dans localStorage
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);
