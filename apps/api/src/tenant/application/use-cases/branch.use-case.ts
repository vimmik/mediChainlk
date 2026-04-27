import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BRANCH_REPOSITORY, type IBranchRepository } from '../../domain/repositories/branch.repository';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { TenantCallerContext } from '../../domain/tenant-access';
import { assertTenantAccess } from '../../domain/tenant-access';
import type { CreateBranchDto } from '../../dto/create-branch.dto';
import type { UpdateBranchDto } from '../../dto/update-branch.dto';

@Injectable()
export class BranchUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    @Inject(BRANCH_REPOSITORY) private readonly branchRepo: IBranchRepository,
  ) {}

  private async assertTenantExists(tenantId: string) {
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
  }

  private async assertBranchExists(branchId: string, tenantId: string) {
    const branch = await this.branchRepo.findById(branchId, tenantId);
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(tenantId: string, dto: CreateBranchDto) {
    await this.assertTenantExists(tenantId);
    if (await this.branchRepo.licenseNoTaken(dto.licenseNo)) {
      throw new ConflictException(`License number "${dto.licenseNo}" is already registered.`);
    }
    return this.branchRepo.create(tenantId, dto);
  }

  async findByTenant(tenantId: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    await this.assertTenantExists(tenantId);
    return this.branchRepo.findByTenant(tenantId);
  }

  async findById(tenantId: string, branchId: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    return this.assertBranchExists(branchId, tenantId);
  }

  async update(tenantId: string, branchId: string, dto: UpdateBranchDto, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    await this.assertBranchExists(branchId, tenantId);
    if (dto.licenseNo && (await this.branchRepo.licenseNoTaken(dto.licenseNo, branchId))) {
      throw new ConflictException(`License number "${dto.licenseNo}" is already registered.`);
    }
    return this.branchRepo.update(branchId, dto);
  }

  async deactivate(tenantId: string, branchId: string) {
    await this.assertBranchExists(branchId, tenantId);
    return this.branchRepo.setStatus(branchId, false);
  }

  async reactivate(tenantId: string, branchId: string) {
    await this.assertBranchExists(branchId, tenantId);
    return this.branchRepo.setStatus(branchId, true);
  }
}
