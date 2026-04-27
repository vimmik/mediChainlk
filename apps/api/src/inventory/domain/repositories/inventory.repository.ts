import type { InventoryItem, Medicine } from '@prisma/client';

export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';

export type InventoryItemWithMedicine = InventoryItem & { medicine: Medicine };

export interface IInventoryRepository {
  findByBranch(tenantId: string, branchId: string): Promise<InventoryItemWithMedicine[]>;
  getLowStock(tenantId: string, branchId: string): Promise<InventoryItemWithMedicine[]>;
  create(data: Record<string, unknown>): Promise<InventoryItem>;
  adjustQuantity(id: string, quantity: number): Promise<InventoryItem>;
}
