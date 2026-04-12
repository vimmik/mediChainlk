import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AssignBranchUserDto } from './dto/assign-branch-user.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  // ─── Tenant CRUD ────────────────────────────────────────────────────────────

  async createTenant(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    return this.prisma.tenant.create({ data: dto });
  }

  async findAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: { select: { branches: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
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

  async updateTenant(id: string, dto: Partial<CreateTenantDto>) {
    await this.findTenantById(id);
    if (dto.slug) {
      const conflict = await this.prisma.tenant.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async deactivateTenant(id: string) {
    await this.findTenantById(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async reactivateTenant(id: string) {
    await this.findTenantById(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: true } });
  }

  // ─── Branch CRUD ─────────────────────────────────────────────────────────────

  async createBranch(tenantId: string, dto: CreateBranchDto) {
    await this.findTenantById(tenantId);
    const licenseConflict = await this.prisma.pharmacyBranch.findUnique({
      where: { licenseNo: dto.licenseNo },
    });
    if (licenseConflict) throw new ConflictException(`License number "${dto.licenseNo}" is already registered.`);
    return this.prisma.pharmacyBranch.create({
      data: { ...dto, tenantId },
    });
  }

  async findBranchesByTenant(tenantId: string) {
    await this.findTenantById(tenantId);
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

  // ─── Branch Staff Assignments ─────────────────────────────────────────────

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
