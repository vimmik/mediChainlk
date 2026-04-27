import type { Order, OrderItem } from '@prisma/client';

export const BILLING_REPOSITORY = 'BILLING_REPOSITORY';

export interface OrderItemCreateData {
  tenantId: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderCreateData {
  tenantId: string;
  branchId: string;
  customerId: string;
  prescriptionId?: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItemCreateData[];
}

export type OrderWithItems = Order & { items: OrderItem[] };

export interface IBillingRepository {
  createOrder(data: OrderCreateData): Promise<OrderWithItems>;
}
