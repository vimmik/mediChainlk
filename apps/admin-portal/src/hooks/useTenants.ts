import api from '@/lib/api';
import type {
    BranchStaffMember,
    PaginatedTenants,
    PharmacyBranch,
    Tenant,
    TenantContact,
    TenantDetail,
    TenantDocument,
    TenantOwner,
    TenantQueryParams,
} from '@medichainlk/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export type { BranchStaffMember, PharmacyBranch, Tenant, TenantContact, TenantDetail, TenantDocument, TenantOwner };

// ─── Tenant queries ──────────────────────────────────────────────────────────

export function useTenants(params?: TenantQueryParams) {
  return useQuery<PaginatedTenants>({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const res = await api.get('/tenants', { params });
      // ResponseInterceptor wraps: { success, data: PaginatedTenants, timestamp }
      // Always unwrap one level to get the actual PaginatedTenants payload.
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload?.data) ? payload : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    },
  });
}

export function useTenant(id: string) {
  return useQuery<TenantDetail>({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const res = await api.get(`/tenants/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/tenants', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created successfully');
    },
    // No onError toast — callers that use mutateAsync handle errors inline
  });
}

export function useUpdateTenant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/tenants/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenants', id] });
      toast.success('Tenant updated successfully');
    },
    onError: () => toast.error('Failed to update tenant'),
  });
}

export function useDeactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant deactivated');
    },
    onError: () => toast.error('Failed to deactivate tenant'),
  });
}

export function useReactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant reactivated');
    },
    onError: () => toast.error('Failed to reactivate tenant'),
  });
}

export function useVerifyTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/verify`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant verified');
    },
    onError: () => toast.error('Failed to verify tenant'),
  });
}

export function useUnverifyTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/unverify`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant unverified');
    },
    onError: () => toast.error('Failed to unverify tenant'),
  });
}

// ─── Owner queries ──────────────────────────────────────────────────────────

export function useOwner(tenantId: string) {
  return useQuery<TenantOwner>({
    queryKey: ['tenants', tenantId, 'owner'],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/owner`);
      return res.data?.data ?? res.data;
    },
    enabled: !!tenantId,
  });
}

export function useUpsertOwner(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const normalize = (value: unknown) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      };

      const payload = {
        ...data,
        fullName: normalize(data.fullName),
        nic: normalize(data.nic),
        phone: normalize(data.phone),
        email: normalize(data.email),
        slmcRegNo: normalize(data.slmcRegNo),
        qualification: normalize(data.qualification),
        addressLine1: normalize(data.addressLine1),
        addressLine2: normalize(data.addressLine2),
        city: normalize(data.city),
        district: normalize(data.district),
      };

      return api.put(`/tenants/${tenantId}/owner`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'owner'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Owner saved successfully');
    },
    onError: () => toast.error('Failed to save owner'),
  });
}

// ─── Contact queries ─────────────────────────────────────────────────────────

export function useContacts(tenantId: string) {
  return useQuery<TenantContact[]>({
    queryKey: ['tenants', tenantId, 'contacts'],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/contacts`);
      return res.data?.data ?? res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateContact(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/tenants/${tenantId}/contacts`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'contacts'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Contact added successfully');
    },
    onError: () => toast.error('Failed to add contact'),
  });
}

export function useUpdateContact(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, ...data }: { contactId: string } & Record<string, unknown>) =>
      api.put(`/tenants/${tenantId}/contacts/${contactId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'contacts'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Contact updated');
    },
    onError: () => toast.error('Failed to update contact'),
  });
}

export function useDeleteContact(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => api.delete(`/tenants/${tenantId}/contacts/${contactId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'contacts'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Contact deleted');
    },
    onError: () => toast.error('Failed to delete contact'),
  });
}

// ─── Document queries ────────────────────────────────────────────────────────

export function useDocuments(tenantId: string) {
  return useQuery<TenantDocument[]>({
    queryKey: ['tenants', tenantId, 'documents'],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/documents`);
      return res.data?.data ?? res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateDocument(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/tenants/${tenantId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'documents'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Document added');
    },
    onError: () => toast.error('Failed to add document'),
  });
}

export function useUpdateDocument(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, ...data }: { documentId: string } & Record<string, unknown>) =>
      api.put(`/tenants/${tenantId}/documents/${documentId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'documents'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Document updated');
    },
    onError: () => toast.error('Failed to update document'),
  });
}

export function useDeleteDocument(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => api.delete(`/tenants/${tenantId}/documents/${documentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'documents'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });
}

// ─── Branch queries ──────────────────────────────────────────────────────────

export function useBranches(tenantId: string) {
  return useQuery<PharmacyBranch[]>({
    queryKey: ['tenants', tenantId, 'branches'],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/branches`);
      return res.data?.data ?? res.data;
    },
    enabled: !!tenantId,
  });
}

export function useBranch(tenantId: string, branchId: string) {
  return useQuery<PharmacyBranch & { staff: BranchStaffMember[] }>({
    queryKey: ['tenants', tenantId, 'branches', branchId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/branches/${branchId}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!tenantId && !!branchId,
  });
}

export function useCreateBranch(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(`/tenants/${tenantId}/branches`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Branch created');
    },
    onError: () => toast.error('Failed to create branch'),
  });
}

export function useUpdateBranch(tenantId: string, branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/tenants/${tenantId}/branches/${branchId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] });
      toast.success('Branch updated');
    },
    onError: () => toast.error('Failed to update branch'),
  });
}

export function useDeactivateBranch(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => api.patch(`/tenants/${tenantId}/branches/${branchId}/deactivate`),
    onSuccess: (_, branchId) => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Branch deactivated');
    },
    onError: () => toast.error('Failed to deactivate branch'),
  });
}

export function useReactivateBranch(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => api.patch(`/tenants/${tenantId}/branches/${branchId}/reactivate`),
    onSuccess: (_, branchId) => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches'] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] });
      qc.invalidateQueries({ queryKey: ['tenants', tenantId] });
      toast.success('Branch reactivated');
    },
    onError: () => toast.error('Failed to reactivate branch'),
  });
}

export function useAssignBranchUser(tenantId: string, branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; isPrimary?: boolean }) =>
      api.post(`/tenants/${tenantId}/branches/${branchId}/staff`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] });
      toast.success('Staff assigned to branch');
    },
    onError: () => toast.error('Failed to assign staff'),
  });
}

export function useRemoveBranchUser(tenantId: string, branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/tenants/${tenantId}/branches/${branchId}/staff/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', tenantId, 'branches', branchId] });
      toast.success('Staff removed from branch');
    },
    onError: () => toast.error('Failed to remove staff'),
  });
}
