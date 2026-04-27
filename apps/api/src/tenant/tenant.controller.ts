import {
  Body,
  Controller,
  Delete,
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
import { BranchUseCase } from './application/use-cases/branch.use-case';
import { CreateTenantUseCase } from './application/use-cases/create-tenant.use-case';
import { GetTenantUseCase } from './application/use-cases/get-tenant.use-case';
import { ProvisionTenantUseCase } from './application/use-cases/provision-tenant.use-case';
import { StaffAssignmentUseCase } from './application/use-cases/staff-assignment.use-case';
import { TenantContactsUseCase } from './application/use-cases/tenant-contacts.use-case';
import { TenantDocumentsUseCase } from './application/use-cases/tenant-documents.use-case';
import { TenantOwnerUseCase } from './application/use-cases/tenant-owner.use-case';
import { UpdateTenantUseCase } from './application/use-cases/update-tenant.use-case';
import type { TenantCallerContext } from './domain/tenant-access';
import { AssignBranchUserDto } from './dto/assign-branch-user.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateTenantOwnerDto } from './dto/create-tenant-owner.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';
import { CreateTenantContactDto, UpdateTenantContactDto } from './dto/tenant-contact.dto';
import { CreateTenantDocumentDto, UpdateTenantDocumentDto } from './dto/tenant-document.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

// Request user shape attached by FirebaseAuthGuard
interface AuthUser extends TenantCallerContext {
  uid: string;
  firebaseUid: string;
}

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly provisionTenant: ProvisionTenantUseCase,
    private readonly getTenant: GetTenantUseCase,
    private readonly updateTenant: UpdateTenantUseCase,
    private readonly tenantOwner: TenantOwnerUseCase,
    private readonly tenantContacts: TenantContactsUseCase,
    private readonly tenantDocuments: TenantDocumentsUseCase,
    private readonly branch: BranchUseCase,
    private readonly staffAssignment: StaffAssignmentUseCase,
  ) {}

  // ─── Tenant endpoints ────────────────────────────────────────────────────────

  @Post()
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create a new pharmacy tenant (brand)' })
  create(@Body() dto: CreateTenantDto) {
    return this.createTenant.execute(dto);
  }

  @Post('provision')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Atomically create tenant + owner + contacts in one transaction' })
  provision(@Body() dto: ProvisionTenantDto) {
    return this.provisionTenant.execute(dto);
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
    return this.getTenant.list({
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
    return this.getTenant.findById(id, req.user);
  }

  @Put(':id')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Update tenant details' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.updateTenant.execute(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Deactivate a tenant' })
  deactivate(@Param('id') id: string) {
    return this.updateTenant.deactivate(id);
  }

  @Patch(':id/reactivate')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Reactivate a tenant' })
  reactivate(@Param('id') id: string) {
    return this.updateTenant.reactivate(id);
  }

  @Patch(':id/verify')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Verify a tenant' })
  verify(@Param('id') id: string) {
    return this.updateTenant.verify(id);
  }

  @Patch(':id/unverify')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Remove verification from a tenant' })
  unverify(@Param('id') id: string) {
    return this.updateTenant.unverify(id);
  }

  // ─── Owner endpoints ──────────────────────────────────────────────────────

  @Put(':id/owner')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create or update tenant owner' })
  upsertOwner(@Param('id') id: string, @Body() dto: CreateTenantOwnerDto) {
    return this.tenantOwner.upsert(id, dto);
  }

  @Get(':id/owner')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get tenant owner details' })
  findOwner(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    return this.tenantOwner.find(id, req.user);
  }

  // ─── Contact endpoints ────────────────────────────────────────────────────

  @Post(':id/contacts')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Add a contact person to a tenant' })
  createContact(@Param('id') id: string, @Body() dto: CreateTenantContactDto) {
    return this.tenantContacts.create(id, dto);
  }

  @Get(':id/contacts')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all contacts for a tenant' })
  findContacts(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    return this.tenantContacts.findAll(id, req.user);
  }

  @Put(':id/contacts/:contactId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Update a tenant contact' })
  updateContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateTenantContactDto,
  ) {
    return this.tenantContacts.update(id, contactId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Delete a tenant contact' })
  deleteContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.tenantContacts.delete(id, contactId);
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
    return this.tenantDocuments.create(id, dto, req.user.firebaseUid);
  }

  @Get(':id/documents')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all documents for a tenant' })
  findDocuments(@Param('id') id: string, @Request() req: { user: AuthUser }) {
    return this.tenantDocuments.findAll(id, req.user);
  }

  @Put(':id/documents/:documentId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Update a tenant document' })
  updateDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateTenantDocumentDto,
  ) {
    return this.tenantDocuments.update(id, documentId, dto);
  }

  @Delete(':id/documents/:documentId')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Delete a tenant document' })
  deleteDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return this.tenantDocuments.delete(id, documentId);
  }

  // ─── Branch endpoints ─────────────────────────────────────────────────────

  @Post(':tenantId/branches')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create a new branch under a tenant' })
  createBranch(@Param('tenantId') tenantId: string, @Body() dto: CreateBranchDto) {
    return this.branch.create(tenantId, dto);
  }

  @Get(':tenantId/branches')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List all branches for a tenant' })
  findBranches(@Param('tenantId') tenantId: string, @Request() req: { user: AuthUser }) {
    return this.branch.findByTenant(tenantId, req.user);
  }

  @Get(':tenantId/branches/:branchId')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get branch detail with assigned staff' })
  findBranch(
    @Param('tenantId') tenantId: string,
    @Param('branchId') branchId: string,
    @Request() req: { user: AuthUser },
  ) {
    return this.branch.findById(tenantId, branchId, req.user);
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
    return this.branch.update(tenantId, branchId, dto, req.user);
  }

  @Patch(':tenantId/branches/:branchId/deactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Deactivate a branch' })
  deactivateBranch(@Param('tenantId') tenantId: string, @Param('branchId') branchId: string) {
    return this.branch.deactivate(tenantId, branchId);
  }

  @Patch(':tenantId/branches/:branchId/reactivate')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Reactivate a branch' })
  reactivateBranch(@Param('tenantId') tenantId: string, @Param('branchId') branchId: string) {
    return this.branch.reactivate(tenantId, branchId);
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
    return this.staffAssignment.assign(tenantId, branchId, dto, req.user.firebaseUid, req.user);
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
    return this.staffAssignment.remove(tenantId, branchId, userId, req.user);
  }
}
