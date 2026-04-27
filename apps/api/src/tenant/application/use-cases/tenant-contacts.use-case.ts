import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { TenantCallerContext } from '../../domain/tenant-access';
import { assertTenantAccess } from '../../domain/tenant-access';
import type { CreateTenantContactDto, UpdateTenantContactDto } from '../../dto/tenant-contact.dto';

@Injectable()
export class TenantContactsUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  async create(tenantId: string, dto: CreateTenantContactDto) {
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
    if (dto.isPrimary) await this.tenantRepo.clearPrimaryContacts(tenantId);
    return this.tenantRepo.createContact(tenantId, dto);
  }

  async findAll(tenantId: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
    return this.tenantRepo.findContacts(tenantId);
  }

  async update(tenantId: string, contactId: string, dto: UpdateTenantContactDto) {
    const contact = await this.tenantRepo.findContact(contactId, tenantId);
    if (!contact) throw new NotFoundException('Contact not found');
    if (dto.isPrimary) await this.tenantRepo.clearPrimaryContacts(tenantId, contactId);
    return this.tenantRepo.updateContact(contactId, dto);
  }

  async delete(tenantId: string, contactId: string) {
    const contact = await this.tenantRepo.findContact(contactId, tenantId);
    if (!contact) throw new NotFoundException('Contact not found');
    return this.tenantRepo.softDeleteContact(contactId);
  }
}
