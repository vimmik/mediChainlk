'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ScreenPermission {
  id: string;
  permissionCode: string;
  screenName: string;
  description: string | null;
  isEnabled?: boolean;
}

export interface PermissionUpdate {
  permissionId: string;
  isEnabled: boolean;
}

export function useAllPermissions() {
  return useQuery<ScreenPermission[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/permissions').then((r) => r.data.data ?? r.data),
  });
}

export function useRolePermissions(role: string) {
  return useQuery<ScreenPermission[]>({
    queryKey: ['permissions', role],
    queryFn: () => api.get(`/permissions/role/${role}`).then((r) => r.data.data ?? r.data),
    enabled: !!role,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, updates }: { role: string; updates: PermissionUpdate[] }) =>
      api.put(`/permissions/role/${role}`, { updates }).then((r) => r.data),
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ['permissions', role] });
    },
  });
}
