import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository, type TenantListQuery } from '../../domain/repositories/tenant.repository';
import type { TenantCallerContext } from '../../domain/tenant-access';
import { assertTenantAccess } from '../../domain/tenant-access';

@Injectable()
export class GetTenantUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  async list(query: TenantListQuery) {
    return this.tenantRepo.findAll(query);
  }

  async findById(id: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, id);
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
