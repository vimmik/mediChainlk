import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ITenantRepository, TenantListQuery } from '../domain/repositories/tenant.repository';
import type { CreateTenantOwnerDto } from '../dto/create-tenant-owner.dto';
import type { CreateTenantDto } from '../dto/create-tenant.dto';
import type { ProvisionTenantDto } from '../dto/provision-tenant.dto';
import type { CreateTenantContactDto, UpdateTenantContactDto } from '../dto/tenant-contact.dto';
import type { CreateTenantDocumentDto, UpdateTenantDocumentDto } from '../dto/tenant-document.dto';
import type { UpdateTenantDto } from '../dto/update-tenant.dto';

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tenant ────────────────────────────────────────────────────────────────

  async findAll(query: TenantListQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      isVerified,
      businessType,
      subscriptionPlan,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.TenantWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (businessType) where.businessType = businessType;
    if (subscriptionPlan) where.subscriptionPlan = subscriptionPlan;

    const allowedSortFields = ['createdAt', 'name', 'city', 'subscriptionPlan', 'isActive'];
    const orderField = allowedSortFields.includes(sortBy ?? '') ? sortBy! : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: { _count: { select: { branches: true, users: true } } },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: true,
        contacts: { where: { isActive: true }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        documents: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
        branches: { orderBy: { createdAt: 'asc' }, include: { _count: { select: { staff: true } } } },
        users: {
          where: { role: 'pharmacy_admin' },
          select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
        },
        _count: { select: { branches: true, users: true } },
      },
    });
  }

  async exists(id: string): Promise<boolean> {
    const t = await this.prisma.tenant.findUnique({ where: { id }, select: { id: true } });
    return t !== null;
  }

  async slugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const found = excludeId
      ? await this.prisma.tenant.findFirst({ where: { slug, NOT: { id: excludeId } }, select: { id: true } })
      : await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    return found !== null;
  }

  async registrationNoTaken(regNo: string, excludeId?: string): Promise<boolean> {
    const found = excludeId
      ? await this.prisma.tenant.findFirst({
          where: { registrationNo: regNo, NOT: { id: excludeId } },
          select: { id: true },
        })
      : await this.prisma.tenant.findUnique({ where: { registrationNo: regNo }, select: { id: true } });
    return found !== null;
  }

  async create(data: CreateTenantDto) {
    return this.prisma.tenant.create({ data });
  }

  /**
   * Atomically create Tenant + optional Owner + optional Contacts.
   * Pre-flight uniqueness checks are done before any transaction.
   * Two-phase batch: first creates the tenant (needs its id), then
   * dependent records in a second batch.
   */
  async provision(dto: ProvisionTenantDto) {
    const [slugConflict, regConflict] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug: dto.tenant.slug }, select: { id: true } }),
      dto.tenant.registrationNo
        ? this.prisma.tenant.findUnique({ where: { registrationNo: dto.tenant.registrationNo }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    if (slugConflict) throw new ConflictException(`Slug "${dto.tenant.slug}" is already taken.`);
    if (regConflict) throw new ConflictException(`Registration number "${dto.tenant.registrationNo}" is already registered.`);

    let primaryAssigned = false;
    const contactData = (dto.contacts ?? []).map((c) => {
      const isPrimary = c.isPrimary === true && !primaryAssigned;
      if (isPrimary) primaryAssigned = true;
      return { ...c, isPrimary };
    });

    let tenant: Awaited<ReturnType<typeof this.prisma.tenant.create>>;
    try {
      [tenant] = await this.prisma.$transaction([this.prisma.tenant.create({ data: dto.tenant })]);
    } catch (err: unknown) {
      const e = err as { code?: string; meta?: { target?: string[] } };
      if (e.code === 'P2002') {
        const field = e.meta?.target?.[0] ?? 'field';
        throw new ConflictException(`A tenant with this ${field} already exists.`);
      }
      throw err;
    }

    const dependentOps: Prisma.PrismaPromise<unknown>[] = [];
    if (dto.owner) {
      dependentOps.push(this.prisma.tenantOwner.create({ data: { ...dto.owner, tenantId: tenant.id } }));
    }
    if (contactData.length) {
      dependentOps.push(
        this.prisma.tenantContact.createMany({ data: contactData.map((c) => ({ ...c, tenantId: tenant.id })) }),
      );
    }
    if (dependentOps.length) await this.prisma.$transaction(dependentOps);

    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
      include: { owner: true, contacts: { where: { isActive: true } }, _count: { select: { branches: true, users: true } } },
    });
  }

  async update(id: string, data: UpdateTenantDto) {
    try {
      return await this.prisma.tenant.update({ where: { id }, data });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2025') throw new NotFoundException('Tenant not found');
      throw err;
    }
  }

  async setStatus(id: string, isActive: boolean) {
    try {
      return await this.prisma.tenant.update({ where: { id }, data: { isActive } });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2025') throw new NotFoundException('Tenant not found');
      throw err;
    }
  }

  async setVerified(id: string, isVerified: boolean) {
    try {
      return await this.prisma.tenant.update({ where: { id }, data: { isVerified } });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2025') throw new NotFoundException('Tenant not found');
      throw err;
    }
  }

  // ── Owner ─────────────────────────────────────────────────────────────────

  async upsertOwner(tenantId: string, data: CreateTenantOwnerDto) {
    return this.prisma.tenantOwner.upsert({
      where: { tenantId },
      create: { ...data, tenantId },
      update: data,
    });
  }

  async findOwner(tenantId: string) {
    return this.prisma.tenantOwner.findUnique({ where: { tenantId } });
  }

  // ── Contacts ──────────────────────────────────────────────────────────────

  async createContact(tenantId: string, data: CreateTenantContactDto) {
    return this.prisma.tenantContact.create({ data: { ...data, tenantId } });
  }

  async findContacts(tenantId: string) {
    return this.prisma.tenantContact.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findContact(contactId: string, tenantId: string) {
    return this.prisma.tenantContact.findFirst({ where: { id: contactId, tenantId } });
  }

  async clearPrimaryContacts(tenantId: string, excludeId?: string) {
    await this.prisma.tenantContact.updateMany({
      where: { tenantId, isPrimary: true, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      data: { isPrimary: false },
    });
  }

  async updateContact(contactId: string, data: UpdateTenantContactDto) {
    return this.prisma.tenantContact.update({ where: { id: contactId }, data });
  }

  async softDeleteContact(contactId: string) {
    return this.prisma.tenantContact.update({ where: { id: contactId }, data: { isActive: false } });
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  async createDocument(tenantId: string, data: CreateTenantDocumentDto, uploadedBy: string) {
    return this.prisma.tenantDocument.create({ data: { ...data, tenantId, uploadedBy } });
  }

  async findDocuments(tenantId: string) {
    return this.prisma.tenantDocument.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDocument(documentId: string, tenantId: string) {
    return this.prisma.tenantDocument.findFirst({ where: { id: documentId, tenantId } });
  }

  async updateDocument(documentId: string, data: UpdateTenantDocumentDto) {
    return this.prisma.tenantDocument.update({ where: { id: documentId }, data });
  }

  async softDeleteDocument(documentId: string) {
    return this.prisma.tenantDocument.update({ where: { id: documentId }, data: { isActive: false } });
  }
}
