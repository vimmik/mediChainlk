import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertInventoryDto } from './dto/upsert-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findByPharmacy(tenantId: string, pharmacyId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId, pharmacyId },
      include: { medicine: true },
      orderBy: { medicine: { genericName: 'asc' } },
    });
  }

  async getLowStockAlerts(tenantId: string, pharmacyId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        pharmacyId,
        quantityOnHand: { lte: this.prisma.inventoryItem.fields.reorderLevel as unknown as number },
      },
      include: { medicine: true },
    });
  }

  async upsert(dto: UpsertInventoryDto, tenantId: string) {
    return this.prisma.inventoryItem.create({
      data: { ...dto, tenantId },
    });
  }

  async adjustQuantity(id: string, quantity: number) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { quantityOnHand: { increment: quantity } },
    });
  }
}
