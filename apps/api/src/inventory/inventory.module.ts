import { Module } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from './domain/repositories/inventory.repository';
import { PrismaInventoryRepository } from './infrastructure/prisma-inventory.repository';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController],
  providers: [
    { provide: INVENTORY_REPOSITORY, useClass: PrismaInventoryRepository },
    InventoryService,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
