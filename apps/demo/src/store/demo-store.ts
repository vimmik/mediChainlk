'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESCRIPTIONS, INVENTORY, ORDERS } from '@/lib/mock-data';

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
}

export const ORDER_STATUS_FLOW = [
  'PRESCRIPTION_CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'DELIVERED',
];

export const NOTIFICATIONS = [
  { id: 'n1', text: 'Rx #RX001 — AI confidence LOW, needs review', dot: 'red', time: '2 min ago' },
  { id: 'n2', text: 'Inventory: Warfarin 5mg critically low (12 units)', dot: 'red', time: '15 min ago' },
  { id: 'n3', text: 'New order #ORD003 from Ruwan Silva', dot: 'blue', time: '32 min ago' },
  { id: 'n4', text: 'PickMe Flash delivery completed — ORD004', dot: 'green', time: '1 hr ago' },
  { id: 'n5', text: 'System: 3 pharmacies synced successfully', dot: 'gray', time: '2 hr ago' },
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
      }),
    },
  ),
);
