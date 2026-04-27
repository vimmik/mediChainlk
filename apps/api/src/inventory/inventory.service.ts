import { Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY, type IInventoryRepository } from './domain/repositories/inventory.repository';
import { UpsertInventoryDto } from './dto/upsert-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly inventoryRepo: IInventoryRepository) {}

  async findByBranch(tenantId: string, branchId: string) {
    return this.inventoryRepo.findByBranch(tenantId, branchId);
  }

  async getLowStockAlerts(tenantId: string, branchId: string) {
    return this.inventoryRepo.getLowStock(tenantId, branchId);
  }

  async upsert(dto: UpsertInventoryDto, tenantId: string) {
    return this.inventoryRepo.create({ ...dto, tenantId });
  }

  async adjustQuantity(id: string, quantity: number) {
    return this.inventoryRepo.adjustQuantity(id, quantity);
  }
}
