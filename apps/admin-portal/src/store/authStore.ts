import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  // Decoded Firebase Custom Claims
  role: string | null;
  tenantId: string | null;
  permissions: string[];
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setClaims: (role: string, tenantId: string | null, permissions: string[]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  role: null,
  tenantId: null,
  permissions: [],
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setClaims: (role, tenantId, permissions) => set({ role, tenantId, permissions }),
  reset: () => set({ user: null, role: null, tenantId: null, permissions: [], loading: false }),
}));
