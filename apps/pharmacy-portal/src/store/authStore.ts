import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  pharmacyId: string | null;
  tenantId: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setPharmacyContext: (pharmacyId: string, tenantId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  pharmacyId: null,
  tenantId: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setPharmacyContext: (pharmacyId, tenantId) => set({ pharmacyId, tenantId }),
}));
