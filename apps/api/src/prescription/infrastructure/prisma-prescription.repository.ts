import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IPrescriptionRepository } from '../domain/repositories/prescription.repository';

@Injectable()
export class PrismaPrescriptionRepository implements IPrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Record<string, unknown>) {
    return this.prisma.prescription.create({ data: data as Parameters<typeof this.prisma.prescription.create>[0]['data'] });
  }

  async findById(id: string) {
    return this.prisma.prescription.findUnique({ where: { id } });
  }

  async updateStatus(id: string, data: Record<string, unknown>) {
    return this.prisma.prescription.update({ where: { id }, data: data as Parameters<typeof this.prisma.prescription.update>[0]['data'] });
  }

  async findPendingReview(tenantId: string, branchId: string) {
    return this.prisma.prescription.findMany({
      where: {
        tenantId,
        branchId,
        status: { in: ['PENDING_REVIEW', 'PHARMACIST_REVIEWING'] },
      },
      include: { customer: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
