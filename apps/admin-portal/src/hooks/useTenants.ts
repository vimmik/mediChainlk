import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { branches: number; users: number };
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  district?: string | null;
  phone: string;
  licenseNo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { staff: number };
}

export interface BranchStaffMember {
  id: string;
  userId: string;
  branchId: string;
  isPrimary: boolean;
  assignedAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role: string;
    isActive: boolean;
  };
}

export interface TenantDetail extends Tenant {
  branches: (Branch & { _count: { staff: number } })[];
  users: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null; isActive: boolean }[];
}

// ─── Tenant queries ──────────────────────────────────────────────────────────

export function useTenants() {
  return useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data.data ?? res.data;
    },
  });
}

export function useTenant(id: string) {
  return useQuery<TenantDetail>({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const res = await api.get(`/tenants/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) => api.post('/tenants', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useUpdateTenant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; slug?: string }) => api.put(`/tenants/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenants', id] });
    },
  });
}

export function useDeactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useReactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/reactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

// ─── Branch queries ──────────────────────────────────────────────────────────

export function useBranches(tenantId: string) {
  return useQuery<Branch[]>({
    queryKey: ['tenants', tenantId, 'branches'],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/branches`);
      return res.data.data ?? res.data;
    },
    enabled: !!tenantId,
  });
}

export function useBranch(tenantId: string, branchId: string) {
  return useQuery<Branch & { staff: BranchStaffMember[] }>({
    queryKey: ['tenants', tenantId, 'branches', branchId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/branches/${branchId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!tenantId && !!branchId,
  });
}

export function useCreateBranch(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Branch, 'id' | 'tenantId' | 'isActive' | 'createdAt' | 'updatedAt' | '_count'>) =>
      api.post(`/tenants/${tenantId}/branches`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
    },
  });
}

export function useUpdateBranch(tenantId: string, branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Branch>) => api.put(`/tenants/${tenantId}/branches/${branchId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] });
    },
  });
}

export function useDeactivateBranch(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => api.patch(`/tenants/${tenantId}/branches/${branchId}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] }),
  });
}

export function useAssignBranchUser(tenantId: string, branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; isPrimary?: boolean }) =>
      api.post(`/tenants/${tenantId}/branches/${branchId}/staff`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] }),
  });
}

export function useRemoveBranchUser(tenantId: string, branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/tenants/${tenantId}/branches/${branchId}/staff/${userId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] }),
  });
}
