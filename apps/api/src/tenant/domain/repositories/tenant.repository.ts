import type { PharmacyBranch, Tenant, TenantContact, TenantDocument, TenantOwner } from '@prisma/client';
import type { CreateTenantOwnerDto } from '../../dto/create-tenant-owner.dto';
import type { CreateTenantDto } from '../../dto/create-tenant.dto';
import type { ProvisionTenantDto } from '../../dto/provision-tenant.dto';
import type { CreateTenantContactDto, UpdateTenantContactDto } from '../../dto/tenant-contact.dto';
import type { CreateTenantDocumentDto, UpdateTenantDocumentDto } from '../../dto/tenant-document.dto';
import type { UpdateTenantDto } from '../../dto/update-tenant.dto';

export const TENANT_REPOSITORY = 'TENANT_REPOSITORY';

export interface TenantListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  businessType?: string;
  subscriptionPlan?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type TenantSummary = Tenant & { _count: { branches: number; users: number } };

export type TenantAdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isActive: boolean;
};

export type TenantDetail = Tenant & {
  owner: TenantOwner | null;
  contacts: TenantContact[];
  documents: TenantDocument[];
  branches: Array<PharmacyBranch & { _count: { staff: number } }>;
  users: TenantAdminUser[];
  _count: { branches: number; users: number };
};

export type ProvisionResult = Tenant & {
  owner: TenantOwner | null;
  contacts: TenantContact[];
  _count: { branches: number; users: number };
};

export interface ITenantRepository {
  // ── Tenant ────────────────────────────────────────────────────────────────
  findAll(query: TenantListQuery): Promise<{
    data: TenantSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findById(id: string): Promise<TenantDetail | null>;
  exists(id: string): Promise<boolean>;
  slugTaken(slug: string, excludeId?: string): Promise<boolean>;
  registrationNoTaken(regNo: string, excludeId?: string): Promise<boolean>;
  create(data: CreateTenantDto): Promise<Tenant>;
  provision(dto: ProvisionTenantDto): Promise<ProvisionResult>;
  update(id: string, data: UpdateTenantDto): Promise<Tenant>;
  setStatus(id: string, isActive: boolean): Promise<Tenant>;
  setVerified(id: string, isVerified: boolean): Promise<Tenant>;

  // ── Owner ─────────────────────────────────────────────────────────────────
  upsertOwner(tenantId: string, data: CreateTenantOwnerDto): Promise<TenantOwner>;
  findOwner(tenantId: string): Promise<TenantOwner | null>;

  // ── Contacts ──────────────────────────────────────────────────────────────
  createContact(tenantId: string, data: CreateTenantContactDto): Promise<TenantContact>;
  findContacts(tenantId: string): Promise<TenantContact[]>;
  findContact(contactId: string, tenantId: string): Promise<TenantContact | null>;
  clearPrimaryContacts(tenantId: string, excludeId?: string): Promise<void>;
  updateContact(contactId: string, data: UpdateTenantContactDto): Promise<TenantContact>;
  softDeleteContact(contactId: string): Promise<TenantContact>;

  // ── Documents ─────────────────────────────────────────────────────────────
  createDocument(tenantId: string, data: CreateTenantDocumentDto, uploadedBy: string): Promise<TenantDocument>;
  findDocuments(tenantId: string): Promise<TenantDocument[]>;
  findDocument(documentId: string, tenantId: string): Promise<TenantDocument | null>;
  updateDocument(documentId: string, data: UpdateTenantDocumentDto): Promise<TenantDocument>;
  softDeleteDocument(documentId: string): Promise<TenantDocument>;
}
