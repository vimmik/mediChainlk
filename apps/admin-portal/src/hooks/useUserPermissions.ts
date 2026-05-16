'use client';

import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export type PermissionSource = 'role' | 'default' | 'grant' | 'revoke';

export interface EffectivePermissionRow {
  permissionId: string;
  permissionCode: string;
  screenName: string;
  description: string | null;
  category: string | null;
  /** Whether the user's Role grants this permission (baseline). */
  fromRole: boolean;
  /** Explicit override decision, if any. */
  override: 'grant' | 'revoke' | null;
  /** Final effective state after Role + Override resolution. */
  effective: boolean;
  source: PermissionSource;
}

export interface EffectivePermissionsResponse {
  user: {
    id: string;
    firebaseUid: string;
    role: string;
    roleId: string | null;
    tenantId: string | null;
  };
  role: { id: string; name: string; isSystem: boolean } | null;
  permissions: EffectivePermissionRow[];
}

export interface OverrideInput {
  permissionId: string;
  isGranted: boolean;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  const d = res.data as { data?: T } | T;
  return (d && typeof d === 'object' && 'data' in d && (d as { data?: T }).data !== undefined)
    ? (d as { data: T }).data
    : (d as T);
}

export function useUserEffectivePermissions(userId: string) {
  return useQuery<EffectivePermissionsResponse>({
    queryKey: ['users', userId, 'effective-permissions'],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/effective-permissions`);
      return unwrap<EffectivePermissionsResponse>(res);
    },
    enabled: !!userId,
  });
}

export function useReplaceUserOverrides(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (overrides: OverrideInput[]) => {
      const res = await api.put(`/users/${userId}/permission-overrides`, { overrides });
      return unwrap<EffectivePermissionsResponse>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', userId, 'effective-permissions'] });
      toast.success('Permissions updated');
    },
    // callers handle errors inline via mutateAsync
  });
}
