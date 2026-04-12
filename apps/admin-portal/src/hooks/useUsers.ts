'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface User {
  id: string;
  firebaseUid: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: string | null;
  tenant?: { name: string } | null;
  branchAssignments?: { id: string; branchId: string; isPrimary: boolean; branch: { id: string; name: string; city: string } }[];
  isActive: boolean;
  nic: string | null;
  birthday: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressLine3: string | null;
  district: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersQuery {
  role?: string;
  tenantId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InviteUserPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  tenantId?: string;
  nic?: string;
  birthday?: string;
  gender?: string;
  height?: number;
  weight?: number;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  district?: string;
  postalCode?: string;
}

export function useUsers(params: ListUsersQuery = {}) {
  return useQuery<ListUsersResponse>({
    queryKey: ['users', params],
    queryFn: () => api.get('/users', { params }).then((r) => r.data.data ?? r.data),
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteUserPayload) =>
      api.post('/users/invite', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      api.put(`/users/${id}`, payload).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/deactivate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/reactivate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
