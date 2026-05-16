'use client';

import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MenuScreenNode {
  id: string;
  type: 'screen';
  label: string;
  route: string | null;
  permissionId: string | null;
  permissionCode: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuChildNode {
  id: string;
  type: 'child';
  label: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  screens: MenuScreenNode[];
}

export interface MenuParentNode {
  id: string;
  type: 'parent';
  label: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  children: MenuChildNode[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  const d = res.data as { data?: T } | T;
  return (d && typeof d === 'object' && 'data' in d && (d as { data?: T }).data !== undefined)
    ? (d as { data: T }).data
    : (d as T);
}

/**
 * The current user's permitted, pruned menu tree.
 * Drives the nested sidebar — only branches the user can access are returned.
 */
export function useMyMenu() {
  return useQuery<MenuParentNode[]>({
    queryKey: ['me', 'menu'],
    queryFn: async () => {
      const res = await api.get('/me/menu');
      const payload = unwrap<MenuParentNode[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    // Menu rarely changes within a session
    staleTime: 5 * 60_000,
  });
}

/** Full menu tree — admin management view (system_admin only). */
export function useFullMenu() {
  return useQuery<MenuParentNode[]>({
    queryKey: ['menu', 'full'],
    queryFn: async () => {
      const res = await api.get('/menu');
      const payload = unwrap<MenuParentNode[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
  });
}

// ─── Mutation payload types ──────────────────────────────────────────────────

export type MenuItemType = 'parent' | 'child' | 'screen';

export interface NewScreenPermission {
  permissionCode: string;
  screenName: string;
  description?: string;
  category?: string;
}

export interface CreateMenuItemPayload {
  type: MenuItemType;
  label: string;
  icon?: string;
  parentId?: string;
  route?: string;
  /** For `screen`: link an existing permission… */
  permissionId?: string;
  /** …OR create a brand-new one atomically. */
  newPermission?: NewScreenPermission;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuItemPayload {
  label?: string;
  icon?: string;
  route?: string;
  permissionId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderEntry {
  id: string;
  sortOrder: number;
}

function invalidateMenu(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['menu', 'full'] });
  qc.invalidateQueries({ queryKey: ['me', 'menu'] });
  // a new screen also creates a permission — refresh the permission catalog
  qc.invalidateQueries({ queryKey: ['permissions'] });
}

// ─── CRUD mutations ──────────────────────────────────────────────────────────

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMenuItemPayload) => {
      const res = await api.post('/menu', payload);
      return unwrap(res);
    },
    onSuccess: () => {
      invalidateMenu(qc);
      toast.success('Menu item created');
    },
    // callers handle errors inline via mutateAsync
  });
}

/** Update a menu item — id passed per-call so one hook instance handles any item. */
export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateMenuItemPayload }) => {
      const res = await api.put(`/menu/${id}`, payload);
      return unwrap(res);
    },
    onSuccess: () => {
      invalidateMenu(qc);
      toast.success('Menu item updated');
    },
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateMenu(qc);
      toast.success('Menu item deleted');
    },
  });
}

export function useReorderMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderEntry[]) =>
      api.put('/menu/reorder', { items }).then((r) => r.data),
    onSuccess: () => invalidateMenu(qc),
  });
}
