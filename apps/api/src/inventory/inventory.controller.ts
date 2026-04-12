import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { UpsertInventoryDto } from './dto/upsert-inventory.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles('pharmacy_staff', 'pharmacy_admin')
  findAll(@CurrentTenant() tenantId: string, @Query('branchId') branchId: string) {
    return this.inventoryService.findByBranch(tenantId, branchId);
  }

  @Get('low-stock')
  @Roles('pharmacy_staff', 'pharmacy_admin')
  getLowStock(@CurrentTenant() tenantId: string, @Query('branchId') branchId: string) {
    return this.inventoryService.getLowStockAlerts(tenantId, branchId);
  }

  @Post()
  @Roles('pharmacy_staff', 'pharmacy_admin')
  upsert(@Body() dto: UpsertInventoryDto, @CurrentTenant() tenantId: string) {
    return this.inventoryService.upsert(dto, tenantId);
  }

  @Patch(':id/adjust')
  @Roles('pharmacy_staff', 'pharmacy_admin')
  adjustQuantity(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.adjustQuantity(id, quantity);
  }
}
