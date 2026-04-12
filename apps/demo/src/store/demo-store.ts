'use client';

import {
    GRN_HEADERS,
    INVENTORY,
    ITEM_REQUESTS,
    ORDERS,
    PRESCRIPTIONS
} from '@/lib/mock-data';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'system_admin' | 'pharmacy_staff' | 'customer';
export type Theme = 'light' | 'dark';

interface ReviewedRx {
  id: string;
  approved: boolean;
  notes: string;
  reviewedAt: string;
}

interface DemoState {
  // Role switcher
  activeRole: Role;
  setRole: (role: Role) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Notifications
  notificationsRead: boolean;
  setNotificationsRead: (read: boolean) => void;

  // Prescription reviews (persisted to localStorage)
  reviewedRx: ReviewedRx[];
  reviewPrescription: (id: string, approved: boolean, notes: string) => void;
  getPrescriptionStatus: (id: string) => string;

  // Inventory adjustments (persisted to localStorage)
  inventoryAdjustments: Record<string, number>;
  adjustStock: (id: string, delta: number) => void;
  getStock: (id: string) => number;

  // Orders (persisted to localStorage)
  orderStatuses: Record<string, string>;
  advanceOrderStatus: (id: string) => void;
  getOrderStatus: (id: string) => string;

  // AI pipeline demo state
  pipelineStep: number;
  setPipelineStep: (step: number) => void;
  pipelineRunning: boolean;
  setPipelineRunning: (v: boolean) => void;

  // Active prescription being reviewed
  activePrescriptionId: string | null;
  setActivePrescription: (id: string | null) => void;

  // GRN approval
  grnApprovals: Record<string, boolean>;
  approveGrn: (id: string) => void;
  isGrnApproved: (id: string) => boolean;

  // Item request approval
  requestApprovals: Record<string, boolean>;
  approveRequest: (id: string) => void;
  isRequestApproved: (id: string) => boolean;

  // Permission toggles (persisted)
  permissionOverrides: Record<string, boolean>;
  togglePermission: (mappingId: string) => void;
  isPermissionEnabled: (mappingId: string) => boolean;
}

export const ORDER_STATUS_FLOW = [
  'PRESCRIPTION_CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'DELIVERED',
];

export const NOTIFICATIONS = [
  { id: 'n1', text: 'Rx #RX005 — AI confidence LOW (58%), needs pharmacist review', dot: 'red', time: '2 min ago' },
  { id: 'n2', text: 'CRITICAL: Warfarin 5mg stock at 12 units — below minimum', dot: 'red', time: '15 min ago' },
  { id: 'n3', text: 'CRITICAL: Clopidogrel 75mg stock at 8 units — reorder now', dot: 'red', time: '18 min ago' },
  { id: 'n4', text: 'New order #ORD006 from Priya Navaratnam', dot: 'blue', time: '32 min ago' },
  { id: 'n5', text: 'PickMe Flash delivery completed — ORD004', dot: 'green', time: '1 hr ago' },
  { id: 'n6', text: 'GRN-2026-005 pending approval (200 Amoxicillin from GSK)', dot: 'amber', time: '1.5 hr ago' },
  { id: 'n7', text: 'Item request REQ-004 pending approval (Warfarin 5mg)', dot: 'amber', time: '2 hr ago' },
  { id: 'n8', text: 'Matara MedHub onboarded — 5th pharmacy live', dot: 'blue', time: '3 hr ago' },
];

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      activeRole: 'pharmacy_staff',
      setRole: (role) => set({ activeRole: role }),

      theme: 'light',
      setTheme: (theme) => set({ theme }),

      notificationsRead: false,
      setNotificationsRead: (read) => set({ notificationsRead: read }),

      reviewedRx: [],
      reviewPrescription: (id, approved, notes) => {
        set((s) => ({
          reviewedRx: [
            ...s.reviewedRx.filter((r) => r.id !== id),
            { id, approved, notes, reviewedAt: new Date().toISOString() },
          ],
        }));
      },
      getPrescriptionStatus: (id) => {
        const reviewed = get().reviewedRx.find((r) => r.id === id);
        if (reviewed) return reviewed.approved ? 'CONFIRMED' : 'REJECTED';
        return PRESCRIPTIONS.find((rx) => rx.id === id)?.status ?? 'PENDING_REVIEW';
      },

      inventoryAdjustments: {},
      adjustStock: (id, delta) =>
        set((s) => ({
          inventoryAdjustments: {
            ...s.inventoryAdjustments,
            [id]: (s.inventoryAdjustments[id] ?? 0) + delta,
          },
        })),
      getStock: (id) => {
        const base = INVENTORY.find((i) => i.id === id)?.stock ?? 0;
        return base + (get().inventoryAdjustments[id] ?? 0);
      },

      orderStatuses: {},
      advanceOrderStatus: (id) => {
        const current = get().getOrderStatus(id);
        const idx = ORDER_STATUS_FLOW.indexOf(current);
        if (idx < ORDER_STATUS_FLOW.length - 1) {
          set((s) => ({
            orderStatuses: { ...s.orderStatuses, [id]: ORDER_STATUS_FLOW[idx + 1] },
          }));
        }
      },
      getOrderStatus: (id) => {
        return get().orderStatuses[id] ?? ORDERS.find((o) => o.id === id)?.status ?? 'PENDING';
      },

      pipelineStep: -1,
      setPipelineStep: (step) => set({ pipelineStep: step }),
      pipelineRunning: false,
      setPipelineRunning: (v) => set({ pipelineRunning: v }),

      activePrescriptionId: null,
      setActivePrescription: (id) => set({ activePrescriptionId: id }),

      // GRN approval
      grnApprovals: {},
      approveGrn: (id) =>
        set((s) => ({ grnApprovals: { ...s.grnApprovals, [id]: true } })),
      isGrnApproved: (id) => {
        if (get().grnApprovals[id]) return true;
        return GRN_HEADERS.find((g) => g.id === id)?.isApproved ?? false;
      },

      // Item request approval
      requestApprovals: {},
      approveRequest: (id) =>
        set((s) => ({ requestApprovals: { ...s.requestApprovals, [id]: true } })),
      isRequestApproved: (id) => {
        if (get().requestApprovals[id]) return true;
        return ITEM_REQUESTS.find((r) => r.id === id)?.isApproved ?? false;
      },

      // Permission toggles
      permissionOverrides: {},
      togglePermission: (mappingId) =>
        set((s) => ({
          permissionOverrides: {
            ...s.permissionOverrides,
            [mappingId]: !(s.permissionOverrides[mappingId] ?? true),
          },
        })),
      isPermissionEnabled: (mappingId) => {
        return get().permissionOverrides[mappingId] ?? true;
      },
    }),
    {
      name: 'medichainlk-demo',
      partialize: (s) => ({
        activeRole: s.activeRole,
        theme: s.theme,
        notificationsRead: s.notificationsRead,
        reviewedRx: s.reviewedRx,
        inventoryAdjustments: s.inventoryAdjustments,
        orderStatuses: s.orderStatuses,
        grnApprovals: s.grnApprovals,
        requestApprovals: s.requestApprovals,
        permissionOverrides: s.permissionOverrides,
      }),
    },
  ),
);

/**
 * Returns false on the server and on the initial client render (before
 * React hydration). Becomes true after the first useEffect fires.
 * Use this to guard any values derived from persisted Zustand state so
 * that the server HTML and the initial client render are identical.
 */
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
