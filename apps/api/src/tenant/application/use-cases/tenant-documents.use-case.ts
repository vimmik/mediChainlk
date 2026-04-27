import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../domain/repositories/tenant.repository';
import type { TenantCallerContext } from '../../domain/tenant-access';
import { assertTenantAccess } from '../../domain/tenant-access';
import type { CreateTenantDocumentDto, UpdateTenantDocumentDto } from '../../dto/tenant-document.dto';

@Injectable()
export class TenantDocumentsUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository) {}

  async create(tenantId: string, dto: CreateTenantDocumentDto, uploadedBy: string) {
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
    return this.tenantRepo.createDocument(tenantId, dto, uploadedBy);
  }

  async findAll(tenantId: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    if (!(await this.tenantRepo.exists(tenantId))) throw new NotFoundException('Tenant not found');
    return this.tenantRepo.findDocuments(tenantId);
  }

  async update(tenantId: string, documentId: string, dto: UpdateTenantDocumentDto) {
    const doc = await this.tenantRepo.findDocument(documentId, tenantId);
    if (!doc) throw new NotFoundException('Document not found');
    return this.tenantRepo.updateDocument(documentId, dto);
  }

  async delete(tenantId: string, documentId: string) {
    const doc = await this.tenantRepo.findDocument(documentId, tenantId);
    if (!doc) throw new NotFoundException('Document not found');
    return this.tenantRepo.softDeleteDocument(documentId);
  }
}
