import { Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { ProvisionTenantDto } from '../../dto/provision-tenant.dto';

@Injectable()
export class ProvisionTenantUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  async execute(dto: ProvisionTenantDto) {
    return this.tenantRepo.provision(dto);
  }
}
