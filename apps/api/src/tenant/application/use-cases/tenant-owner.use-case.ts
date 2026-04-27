import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { TenantCallerContext } from '../../domain/tenant-access';
import { assertTenantAccess } from '../../domain/tenant-access';
import type { CreateTenantOwnerDto } from '../../dto/create-tenant-owner.dto';

@Injectable()
export class TenantOwnerUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  async upsert(tenantId: string, dto: CreateTenantOwnerDto) {
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
    return this.tenantRepo.upsertOwner(tenantId, dto);
  }

  async find(tenantId: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
    const owner = await this.tenantRepo.findOwner(tenantId);
    if (!owner) throw new NotFoundException('Owner not found for this tenant');
    return owner;
  }
}
