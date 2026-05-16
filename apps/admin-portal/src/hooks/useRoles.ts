'use client';

import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RoleScope = 'system' | 'tenant' | 'branch' | 'customer';

export interface ScreenPermission {
  id: string;
  permissionCode: string;
  screenName: string;
  description?: string | null;
  category?: string | null;
}

export interface RolePermissionLink {
  id: string;
  permissionId: string;
  permission: ScreenPermission;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  isSystem: boolean;
  isActive: boolean;
  tenantId: string | null;
  tenant?: { id: string; name: string } | null;
  permissions: RolePermissionLink[];
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  scope: RoleScope;
  tenantId?: string;
  permissionIds: string[];
  isActive?: boolean;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface ListRolesParams {
  scope?: RoleScope;
  tenantId?: string;
  includeSystem?: boolean;
  isActive?: boolean;
  search?: string;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: { data: { data?: T } | T }): T {
  const d = res.data as { data?: T } | T;
  return (d && typeof d === 'object' && 'data' in d && (d as { data?: T }).data !== undefined)
    ? (d as { data: T }).data
    : (d as T);
}

export function useRoles(params: ListRolesParams = {}) {
  return useQuery<Role[]>({
    queryKey: ['roles', params],
    queryFn: async () => {
      const res = await api.get('/roles', { params });
      const payload = unwrap<Role[] | { data: Role[] }>(res);
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    },
  });
}

export function useRole(id: string) {
  return useQuery<Role>({
    queryKey: ['roles', id],
    queryFn: async () => {
      const res = await api.get(`/roles/${id}`);
      return unwrap<Role>(res);
    },
    enabled: !!id,
  });
}

export function usePermissions() {
  return useQuery<ScreenPermission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/permissions');
      const payload = unwrap<ScreenPermission[] | { data: ScreenPermission[] }>(res);
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    },
    // Permissions catalog changes very rarely
    staleTime: 5 * 60_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRolePayload) => {
      const res = await api.post('/roles', payload);
      return unwrap<Role>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created');
    },
    // callers using mutateAsync handle the error inline
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateRolePayload) => {
      const res = await api.put(`/roles/${id}`, payload);
      return unwrap<Role>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.invalidateQueries({ queryKey: ['roles', id] });
      toast.success('Role updated');
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted');
    },
  });
}
