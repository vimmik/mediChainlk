import type { Payment } from '@prisma/client';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface IPaymentRepository {
  createPayment(data: Record<string, unknown>): Promise<Payment>;
  updateByOrderId(orderId: string, data: Record<string, unknown>): Promise<Payment>;
}
