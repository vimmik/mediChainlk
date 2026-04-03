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
  @Roles('pharmacy_staff', 'pharmacy_owner')
  findAll(@CurrentTenant() tenantId: string, @Query('pharmacyId') pharmacyId: string) {
    return this.inventoryService.findByPharmacy(tenantId, pharmacyId);
  }

  @Get('low-stock')
  @Roles('pharmacy_staff', 'pharmacy_owner')
  getLowStock(@CurrentTenant() tenantId: string, @Query('pharmacyId') pharmacyId: string) {
    return this.inventoryService.getLowStockAlerts(tenantId, pharmacyId);
  }

  @Post()
  @Roles('pharmacy_staff', 'pharmacy_owner')
  upsert(@Body() dto: UpsertInventoryDto, @CurrentTenant() tenantId: string) {
    return this.inventoryService.upsert(dto, tenantId);
  }

  @Patch(':id/adjust')
  @Roles('pharmacy_staff', 'pharmacy_owner')
  adjustQuantity(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.adjustQuantity(id, quantity);
  }
}
