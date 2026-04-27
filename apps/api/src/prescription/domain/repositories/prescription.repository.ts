import type { Prescription, User } from '@prisma/client';

export const PRESCRIPTION_REPOSITORY = 'PRESCRIPTION_REPOSITORY';

export type PrescriptionWithCustomer = Prescription & { customer: User };

export interface IPrescriptionRepository {
  create(data: Record<string, unknown>): Promise<Prescription>;
  findById(id: string): Promise<Prescription | null>;
  updateStatus(id: string, data: Record<string, unknown>): Promise<Prescription>;
  findPendingReview(tenantId: string, branchId: string): Promise<PrescriptionWithCustomer[]>;
}
