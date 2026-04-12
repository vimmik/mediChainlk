import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AssignBranchUserDto } from './dto/assign-branch-user.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ─── Tenant endpoints ────────────────────────────────────────────────────────

  @Post()
  @Roles('system_admin')
  @ApiOperation({ summary: 'Create a new pharmacy tenant (brand)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto);
  }

  @Get()
  @Roles('system_admin')
  @ApiOperation({ summary: 'List all tenants with branch/user counts' })
  findAll() {
    return this.tenantService.findAllTenants();
  }

  @Get(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get tenant detail with branches and admins' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findTenantById(id);
  }

  @Put(':id')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Update tenant name or slug' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateTenantDto>) {
    return this.tenantService.updateTenant(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Deactivate a tenant' })
  deactivate(@Param('id') id: string) {
    return this.tenantService.deactivateTenant(id);
  }

  @Patch(':id/reactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Reactivate a tenant' })
  reactivate(@Param('id') id: string) {
    return this.tenantService.reactivateTenant(id);
  }

  // ─── Branch endpoints ─────────────────────────────────────────────────────

  @Post(':tenantId/branches')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Create a new branch under a tenant' })
  createBranch(@Param('tenantId') tenantId: string, @Body() dto: CreateBranchDto) {
    return this.tenantService.createBranch(tenantId, dto);
  }

  @Get(':tenantId/branches')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all branches for a tenant' })
  findBranches(@Param('tenantId') tenantId: string) {
    return this.tenantService.findBranchesByTenant(tenantId);
  }

  @Get(':tenantId/branches/:branchId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get branch detail with assigned staff' })
  findBranch(@Param('tenantId') tenantId: string, @Param('branchId') branchId: string) {
    return this.tenantService.findBranchById(tenantId, branchId);
  }

  @Put(':tenantId/branches/:branchId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Update a branch' })
  updateBranch(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.tenantService.updateBranch(tenantId, branchId, dto);
  }

  @Patch(':tenantId/branches/:branchId/deactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Deactivate a branch' })
  deactivateBranch(@Param('tenantId') tenantId: string, @Param('branchId') branchId: string) {
    return this.tenantService.deactivateBranch(tenantId, branchId);
  }

  // ─── Branch staff assignment endpoints ──────────────────────────────────────

  @Post(':tenantId/branches/:branchId/staff')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Assign a user to a branch' })
  assignUser(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Body() dto: AssignBranchUserDto,
    @Request() req: { user: { firebaseUid: string } },
  ) {
    return this.tenantService.assignUserToBranch(tenantId, branchId, dto, req.user.firebaseUid);
  }

  @Delete(':tenantId/branches/:branchId/staff/:userId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Remove a user from a branch' })
  removeUser(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantService.removeUserFromBranch(tenantId, branchId, userId);
  }
}
