import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AssignBranchUserDto } from './dto/assign-branch-user.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateTenantOwnerDto } from './dto/create-tenant-owner.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';
import { CreateTenantContactDto, UpdateTenantContactDto } from './dto/tenant-contact.dto';
import { CreateTenantDocumentDto, UpdateTenantDocumentDto } from './dto/tenant-document.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';

// Request user shape attached by FirebaseAuthGuard
interface AuthUser {
  uid: string;
  firebaseUid: string;
  role: string;
  tenantId: string | null;
}

/**
 * Enforce that a pharmacy_admin can only access resources belonging to
 * their own tenant. system_admin has no restriction.
 */
function assertTenantAccess(user: AuthUser, targetTenantId: string): void {
  if (user.role === 'system_admin') return;
  if (user.tenantId !== targetTenantId) {
    throw new ForbiddenException('You do not have access to this tenant');
  }
}

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ─── Tenant endpoints ────────────────────────────────────────────────────────

  @Post()
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create a new pharmacy tenant (brand)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto);
  }

  @Post('provision')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Atomically create tenant + owner + contacts in one transaction' })
  provision(@Body() dto: ProvisionTenantDto) {
    return this.tenantService.provisionTenant(dto);
  }

  @Get()
  @Roles('system_admin')
  @ApiOperation({ summary: 'List all tenants with pagination, search & filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'businessType', required: false, type: String })
  @ApiQuery({ name: 'subscriptionPlan', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('isVerified') isVerified?: string,
    @Query('businessType') businessType?: string,
    @Query('subscriptionPlan') subscriptionPlan?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tenantService.findAllTenants({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
      businessType,
      subscriptionPlan,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get tenant detail with branches, owner, contacts, documents' })
  findOne(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    assertTenantAccess(req.user, id);
    return this.tenantService.findTenantById(id);
  }

  @Put(':id')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Update tenant details' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateTenant(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Deactivate a tenant' })
  deactivate(@Param('id') id: string) {
    return this.tenantService.deactivateTenant(id);
  }

  @Patch(':id/reactivate')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Reactivate a tenant' })
  reactivate(@Param('id') id: string) {
    return this.tenantService.reactivateTenant(id);
  }

  @Patch(':id/verify')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Verify a tenant' })
  verify(@Param('id') id: string) {
    return this.tenantService.verifyTenant(id);
  }

  @Patch(':id/unverify')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Remove verification from a tenant' })
  unverify(@Param('id') id: string) {
    return this.tenantService.unverifyTenant(id);
  }

  // ─── Owner endpoints ──────────────────────────────────────────────────────

  @Put(':id/owner')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create or update tenant owner' })
  upsertOwner(@Param('id') id: string, @Body() dto: CreateTenantOwnerDto) {
    return this.tenantService.upsertOwner(id, dto);
  }

  @Get(':id/owner')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get tenant owner details' })
  findOwner(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    assertTenantAccess(req.user, id);
    return this.tenantService.findOwner(id);
  }

  // ─── Contact endpoints ────────────────────────────────────────────────────

  @Post(':id/contacts')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Add a contact person to a tenant' })
  createContact(@Param('id') id: string, @Body() dto: CreateTenantContactDto) {
    return this.tenantService.createContact(id, dto);
  }

  @Get(':id/contacts')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all contacts for a tenant' })
  findContacts(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    assertTenantAccess(req.user, id);
    return this.tenantService.findContacts(id);
  }

  @Put(':id/contacts/:contactId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Update a tenant contact' })
  updateContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateTenantContactDto,
  ) {
    return this.tenantService.updateContact(id, contactId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Delete a tenant contact' })
  deleteContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.tenantService.deleteContact(id, contactId);
  }

  // ─── Document endpoints ───────────────────────────────────────────────────

  @Post(':id/documents')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Add a document to a tenant' })
  createDocument(
    @Param('id') id: string,
    @Body() dto: CreateTenantDocumentDto,
    @Request() req: { user: { firebaseUid: string } },
  ) {
    return this.tenantService.createDocument(id, dto, req.user.firebaseUid);
  }

  @Get(':id/documents')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all documents for a tenant' })
  findDocuments(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    assertTenantAccess(req.user, id);
    return this.tenantService.findDocuments(id);
  }

  @Put(':id/documents/:documentId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Update a tenant document' })
  updateDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateTenantDocumentDto,
  ) {
    return this.tenantService.updateDocument(id, documentId, dto);
  }

  @Delete(':id/documents/:documentId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Delete a tenant document' })
  deleteDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return this.tenantService.deleteDocument(id, documentId);
  }

  // ─── Branch endpoints ─────────────────────────────────────────────────────

  @Post(':tenantId/branches')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create a new branch under a tenant' })
  createBranch(@Param('tenantId') tenantId: string, @Body() dto: CreateBranchDto) {
    return this.tenantService.createBranch(tenantId, dto);
  }

  @Get(':tenantId/branches')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all branches for a tenant' })
  findBranches(@Param('tenantId') tenantId: string, @Request() req: { user: AuthUser }) {
    assertTenantAccess(req.user, tenantId);
    return this.tenantService.findBranchesByTenant(tenantId);
  }

  @Get(':tenantId/branches/:branchId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get branch detail with assigned staff' })
  findBranch(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Request() req: { user: AuthUser },
  ) {
    assertTenantAccess(req.user, tenantId);
    return this.tenantService.findBranchById(tenantId, branchId);
  }

  @Put(':tenantId/branches/:branchId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Update a branch' })
  updateBranch(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
    @Request() req: { user: AuthUser },
  ) {
    assertTenantAccess(req.user, tenantId);
    return this.tenantService.updateBranch(tenantId, branchId, dto);
  }

  @Patch(':tenantId/branches/:branchId/deactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Deactivate a branch' })
  deactivateBranch(@Param('tenantId') tenantId: string, @Param('branchId') branchId: string) {
    return this.tenantService.deactivateBranch(tenantId, branchId);
  }

  @Patch(':tenantId/branches/:branchId/reactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Reactivate a branch' })
  reactivateBranch(@Param('tenantId') tenantId: string, @Param('branchId') branchId: string) {
    return this.tenantService.reactivateBranch(tenantId, branchId);
  }

  // ─── Branch staff assignment endpoints ──────────────────────────────────────

  @Post(':tenantId/branches/:branchId/staff')
  @Roles('system_admin', 'pharmacy_admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Assign a user to a branch' })
  assignUser(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Body() dto: AssignBranchUserDto,
    @Request() req: { user: AuthUser },
  ) {
    assertTenantAccess(req.user, tenantId);
    return this.tenantService.assignUserToBranch(tenantId, branchId, dto, req.user.firebaseUid);
  }

  @Delete(':tenantId/branches/:branchId/staff/:userId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Remove a user from a branch' })
  removeUser(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Param('userId') userId: string,
    @Request() req: { user: AuthUser },
  ) {
    assertTenantAccess(req.user, tenantId);
    return this.tenantService.removeUserFromBranch(tenantId, branchId, userId);
  }
}