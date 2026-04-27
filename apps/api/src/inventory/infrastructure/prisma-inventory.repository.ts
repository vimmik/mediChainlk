import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IInventoryRepository } from '../domain/repositories/inventory.repository';

@Injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBranch(tenantId: string, branchId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId, branchId },
      include: { medicine: true },
      orderBy: { medicine: { genericName: 'asc' } },
    });
  }

  async getLowStock(tenantId: string, branchId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        branchId,
        quantityOnHand: { lte: 10 },
      },
      include: { medicine: true },
    });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.inventoryItem.create({ data: data as Parameters<typeof this.prisma.inventoryItem.create>[0]['data'] });
  }

  async adjustQuantity(id: string, quantity: number) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { quantityOnHand: { increment: quantity } },
    });
  }
}
