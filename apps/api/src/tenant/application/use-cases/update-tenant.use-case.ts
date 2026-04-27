import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { UpdateTenantDto } from '../../dto/update-tenant.dto';

@Injectable()
export class UpdateTenantUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  private async assertExists(id: string) {
    if (!(await this.tenantRepo.exists(id))) throw new NotFoundException('Tenant not found');
  }

  async execute(id: string, dto: UpdateTenantDto) {
    await this.assertExists(id);

    if (dto.slug && (await this.tenantRepo.slugTaken(dto.slug, id))) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }
    if (dto.registrationNo && (await this.tenantRepo.registrationNoTaken(dto.registrationNo, id))) {
      throw new ConflictException(`Registration number "${dto.registrationNo}" is already registered.`);
    }

    return this.tenantRepo.update(id, dto);
  }

  async deactivate(id: string) {
    await this.assertExists(id);
    return this.tenantRepo.setStatus(id, false);
  }

  async reactivate(id: string) {
    await this.assertExists(id);
    return this.tenantRepo.setStatus(id, true);
  }

  async verify(id: string) {
    await this.assertExists(id);
    return this.tenantRepo.setVerified(id, true);
  }

  async unverify(id: string) {
    await this.assertExists(id);
    return this.tenantRepo.setVerified(id, false);
  }
}
