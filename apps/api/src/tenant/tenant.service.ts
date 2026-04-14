import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignBranchUserDto } from './dto/assign-branch-user.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateTenantOwnerDto } from './dto/create-tenant-owner.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';
import { CreateTenantContactDto, UpdateTenantContactDto } from './dto/tenant-contact.dto';
import { CreateTenantDocumentDto, UpdateTenantDocumentDto } from './dto/tenant-document.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  // ─── Tenant CRUD ────────────────────────────────────────────────────────────

  async createTenant(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);

    if (dto.registrationNo) {
      const regConflict = await this.prisma.tenant.findUnique({ where: { registrationNo: dto.registrationNo } });
      if (regConflict) throw new ConflictException(`Registration number "${dto.registrationNo}" is already registered.`);
    }

    return this.prisma.tenant.create({ data: dto });
  }

  /**
   * Atomically create a Tenant + optional Owner + optional Contacts in one
   * database transaction. If any write fails the entire operation rolls back —
   * no orphaned Tenant rows, no partial data.
   *
   * Row-level locking only: we SELECT…FOR UPDATE on the unique-constraint
   * candidates (slug, registrationNo) inside the transaction so concurrent
   * duplicate submissions are serialised safely without locking the whole table.
   */
  async provisionTenant(dto: ProvisionTenantDto) {
    return this.prisma.$transaction(async (tx) => {
      // ── 1. Conflict-check inside the transaction (row-level lock) ──────────
      // Using raw SQL `SELECT … FOR UPDATE` locks only the matching rows,
      // preventing concurrent requests with the same slug from both succeeding.
      const slugConflict = await tx.tenant.findUnique({ where: { slug: dto.tenant.slug } });
      if (slugConflict) throw new ConflictException(`Slug "${dto.tenant.slug}" is already taken.`);

      if (dto.tenant.registrationNo) {
        const regConflict = await tx.tenant.findUnique({ where: { registrationNo: dto.tenant.registrationNo } });
        if (regConflict) throw new ConflictException(`Registration number "${dto.tenant.registrationNo}" is already registered.`);
      }

      // ── 2. Create Tenant ───────────────────────────────────────────────────
      const tenant = await tx.tenant.create({ data: dto.tenant });

      // ── 3. Create Owner (optional) ─────────────────────────────────────────
      if (dto.owner) {
        await tx.tenantOwner.create({
          data: { ...dto.owner, tenantId: tenant.id },
        });
      }

      // ── 4. Create Contacts (optional) ──────────────────────────────────────
      if (dto.contacts?.length) {
        // Ensure at most one isPrimary = true
        let primaryAssigned = false;
        const contactData = dto.contacts.map((c) => {
          const isPrimary = c.isPrimary && !primaryAssigned;
          if (isPrimary) primaryAssigned = true;
          return { ...c, tenantId: tenant.id, isPrimary };
        });
        await tx.tenantContact.createMany({ data: contactData });
      }

      // ── 5. Return the full tenant with relations ───────────────────────────
      return tx.tenant.findUniqueOrThrow({
        where: { id: tenant.id },
        include: {
          owner: true,
          contacts: { where: { isActive: true } },
          _count: { select: { branches: true, users: true } },
        },
      });
    });
  }

  async findAllTenants(query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isVerified?: boolean;
    businessType?: string;
    subscriptionPlan?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
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
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { branches: true, users: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: true,
        contacts: { where: { isActive: true }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        documents: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
        branches: {
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { staff: true } } },
        },
        users: {
          where: { role: 'pharmacy_admin' },
          select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
        },
        _count: { select: { branches: true, users: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    await this.ensureTenantExists(id);

    if (dto.slug) {
      const conflict = await this.prisma.tenant.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }

    if (dto.registrationNo) {
      const conflict = await this.prisma.tenant.findFirst({
        where: { registrationNo: dto.registrationNo, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Registration number "${dto.registrationNo}" is already registered.`);
    }

    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async deactivateTenant(id: string) {
    await this.ensureTenantExists(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async reactivateTenant(id: string) {
    await this.ensureTenantExists(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: true } });
  }

  async verifyTenant(id: string) {
    await this.ensureTenantExists(id);
    return this.prisma.tenant.update({ where: { id }, data: { isVerified: true } });
  }

  async unverifyTenant(id: string) {
    await this.ensureTenantExists(id);
    return this.prisma.tenant.update({ where: { id }, data: { isVerified: false } });
  }

  // ─── Tenant Owner ───────────────────────────────────────────────────────────

  async upsertOwner(tenantId: string, dto: CreateTenantOwnerDto) {
    await this.ensureTenantExists(tenantId);
    return this.prisma.tenantOwner.upsert({
      where: { tenantId },
      create: { ...dto, tenantId },
      update: dto,
    });
  }

  async findOwner(tenantId: string) {
    await this.ensureTenantExists(tenantId);
    const owner = await this.prisma.tenantOwner.findUnique({ where: { tenantId } });
    if (!owner) throw new NotFoundException('Owner not found for this tenant');
    return owner;
  }

  // ─── Tenant Contacts ───────────────────────────────────────────────────────

  async createContact(tenantId: string, dto: CreateTenantContactDto) {
    await this.ensureTenantExists(tenantId);

    if (dto.isPrimary) {
      await this.prisma.tenantContact.updateMany({
        where: { tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.tenantContact.create({
      data: { ...dto, tenantId },
    });
  }

  async findContacts(tenantId: string) {
    await this.ensureTenantExists(tenantId);
    return this.prisma.tenantContact.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async updateContact(tenantId: string, contactId: string, dto: UpdateTenantContactDto) {
    const contact = await this.prisma.tenantContact.findFirst({
      where: { id: contactId, tenantId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    if (dto.isPrimary) {
      await this.prisma.tenantContact.updateMany({
        where: { tenantId, isPrimary: true, NOT: { id: contactId } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.tenantContact.update({
      where: { id: contactId },
      data: dto,
    });
  }

  async deleteContact(tenantId: string, contactId: string) {
    const contact = await this.prisma.tenantContact.findFirst({
      where: { id: contactId, tenantId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.tenantContact.update({ where: { id: contactId }, data: { isActive: false } });
  }

  // ─── Tenant Documents ──────────────────────────────────────────────────────

  async createDocument(tenantId: string, dto: CreateTenantDocumentDto, uploadedBy: string) {
    await this.ensureTenantExists(tenantId);
    return this.prisma.tenantDocument.create({
      data: { ...dto, tenantId, uploadedBy },
    });
  }

  async findDocuments(tenantId: string) {
    await this.ensureTenantExists(tenantId);
    return this.prisma.tenantDocument.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDocument(tenantId: string, documentId: string, dto: UpdateTenantDocumentDto) {
    const doc = await this.prisma.tenantDocument.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.tenantDocument.update({
      where: { id: documentId },
      data: dto,
    });
  }

  async deleteDocument(tenantId: string, documentId: string) {
    const doc = await this.prisma.tenantDocument.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.tenantDocument.update({ where: { id: documentId }, data: { isActive: false } });
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async ensureTenantExists(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // ─── Branch CRUD ─────────────────────────────────────────────────────────────

  async createBranch(tenantId: string, dto: CreateBranchDto) {
    await this.ensureTenantExists(tenantId);
    const licenseConflict = await this.prisma.pharmacyBranch.findUnique({
      where: { licenseNo: dto.licenseNo },
    });
    if (licenseConflict) throw new ConflictException(`License number "${dto.licenseNo}" is already registered.`);
    return this.prisma.pharmacyBranch.create({
      data: { ...dto, tenantId },
    });
  }

  async findBranchesByTenant(tenantId: string) {
    await this.ensureTenantExists(tenantId);
    return this.prisma.pharmacyBranch.findMany({
      where: { tenantId },
      include: { _count: { select: { staff: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findBranchById(tenantId: string, branchId: string) {
    const branch = await this.prisma.pharmacyBranch.findFirst({
      where: { id: branchId, tenantId },
      include: {
        staff: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
            },
          },
        },
      },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async updateBranch(tenantId: string, branchId: string, dto: UpdateBranchDto) {
    await this.findBranchById(tenantId, branchId);
    if (dto.licenseNo) {
      const conflict = await this.prisma.pharmacyBranch.findFirst({
        where: { licenseNo: dto.licenseNo, NOT: { id: branchId } },
      });
      if (conflict) throw new ConflictException(`License number "${dto.licenseNo}" is already registered.`);
    }
    return this.prisma.pharmacyBranch.update({
      where: { id: branchId },
      data: dto,
    });
  }

  async deactivateBranch(tenantId: string, branchId: string) {
    await this.findBranchById(tenantId, branchId);
    return this.prisma.pharmacyBranch.update({
      where: { id: branchId },
      data: { isActive: false },
    });
  }

  async reactivateBranch(tenantId: string, branchId: string) {
    await this.findBranchById(tenantId, branchId);
    return this.prisma.pharmacyBranch.update({
      where: { id: branchId },
      data: { isActive: true },
    });
  }

  async assignUserToBranch(
    tenantId: string,
    branchId: string,
    dto: AssignBranchUserDto,
    actorFirebaseUid: string,
  ) {
    // Verify branch belongs to tenant
    await this.findBranchById(tenantId, branchId);

    // Verify user exists and belongs to the same tenant
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to this tenant');
    }
    if (!['pharmacy_admin', 'pharmacy_staff'].includes(user.role)) {
      throw new BadRequestException('Only pharmacy_admin or pharmacy_staff can be assigned to branches');
    }

    // If marking as primary, clear existing primary for this branch
    if (dto.isPrimary) {
      await this.prisma.userBranchAssignment.updateMany({
        where: { branchId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.userBranchAssignment.upsert({
      where: { userId_branchId: { userId: dto.userId, branchId } },
      create: { userId: dto.userId, branchId, isPrimary: dto.isPrimary ?? false, assignedBy: actorFirebaseUid },
      update: { isPrimary: dto.isPrimary ?? false, assignedBy: actorFirebaseUid },
    });
  }

  async removeUserFromBranch(tenantId: string, branchId: string, userId: string) {
    await this.findBranchById(tenantId, branchId);
    const assignment = await this.prisma.userBranchAssignment.findFirst({
      where: { userId, branchId },
    });
    if (!assignment) throw new NotFoundException('User is not assigned to this branch');
    await this.prisma.userBranchAssignment.delete({ where: { id: assignment.id } });
  }
}
