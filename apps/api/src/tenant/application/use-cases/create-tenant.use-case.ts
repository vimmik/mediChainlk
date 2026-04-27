import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { CreateTenantDto } from '../../dto/create-tenant.dto';

@Injectable()
export class CreateTenantUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  async execute(dto: CreateTenantDto) {
    if (await this.tenantRepo.slugTaken(dto.slug)) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }
    if (dto.registrationNo && (await this.tenantRepo.registrationNoTaken(dto.registrationNo))) {
      throw new ConflictException(`Registration number "${dto.registrationNo}" is already registered.`);
    }
    return this.tenantRepo.create(dto);
  }
}
