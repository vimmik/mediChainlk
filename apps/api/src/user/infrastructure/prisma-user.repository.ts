import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IUserRepository } from '../domain/repositories/user.repository';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(where: Record<string, unknown>, page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { name: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        branchAssignments: {
          include: {
            branch: { select: { id: true, name: true, city: true } },
          },
        },
        diseases: { include: { disease: true } },
      },
    });
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({ where: { firebaseUid } });
  }

  async countSystemAdmins() {
    return this.prisma.user.count({ where: { role: 'system_admin', isActive: true } });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.user.create({ data: data as Parameters<typeof this.prisma.user.create>[0]['data'] });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.user.update({ where: { id }, data: data as Parameters<typeof this.prisma.user.update>[0]['data'] });
  }

  async setStatus(id: string, isActive: boolean) {
    await this.prisma.user.update({ where: { id }, data: { isActive } });
    return this.prisma.user.findUnique({ where: { id } });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }
}
