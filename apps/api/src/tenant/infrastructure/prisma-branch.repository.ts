import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IBranchRepository } from '../domain/repositories/branch.repository';
import type { AssignBranchUserDto } from '../dto/assign-branch-user.dto';
import type { CreateBranchDto } from '../dto/create-branch.dto';
import type { UpdateBranchDto } from '../dto/update-branch.dto';

@Injectable()
export class PrismaBranchRepository implements IBranchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.pharmacyBranch.findMany({
      where: { tenantId },
      include: { _count: { select: { staff: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(branchId: string, tenantId: string) {
    return this.prisma.pharmacyBranch.findFirst({
      where: { id: branchId, tenantId },
      include: {
        staff: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true } },
          },
        },
      },
    });
  }

  async licenseNoTaken(licenseNo: string, excludeId?: string): Promise<boolean> {
    const found = excludeId
      ? await this.prisma.pharmacyBranch.findFirst({ where: { licenseNo, NOT: { id: excludeId } }, select: { id: true } })
      : await this.prisma.pharmacyBranch.findUnique({ where: { licenseNo }, select: { id: true } });
    return found !== null;
  }

  async create(tenantId: string, data: CreateBranchDto) {
    return this.prisma.pharmacyBranch.create({ data: { ...data, tenantId } });
  }

  async update(branchId: string, data: UpdateBranchDto) {
    try {
      return await this.prisma.pharmacyBranch.update({ where: { id: branchId }, data });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2025') throw new NotFoundException('Branch not found');
      throw err;
    }
  }

  async setStatus(branchId: string, isActive: boolean) {
    try {
      return await this.prisma.pharmacyBranch.update({ where: { id: branchId }, data: { isActive } });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2025') throw new NotFoundException('Branch not found');
      throw err;
    }
  }

  // Validation (user exists, belongs to tenant, valid role) is done in StaffAssignmentUseCase
  async assignUser(branchId: string, dto: AssignBranchUserDto, actorFirebaseUid: string) {
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

  async removeUser(branchId: string, userId: string) {
    const assignment = await this.prisma.userBranchAssignment.findFirst({ where: { userId, branchId } });
    if (!assignment) throw new NotFoundException('User is not assigned to this branch');
    await this.prisma.userBranchAssignment.delete({ where: { id: assignment.id } });
  }
}
