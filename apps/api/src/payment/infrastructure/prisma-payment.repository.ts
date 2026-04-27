import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { IPaymentRepository } from '../domain/repositories/payment.repository';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(data: Record<string, unknown>) {
    return this.prisma.payment.create({
      data: {
        ...(data as Parameters<typeof this.prisma.payment.create>[0]['data']),
        amount: new Decimal(data['amount'] as number),
      },
    });
  }

  async updateByOrderId(orderId: string, data: Record<string, unknown>) {
    return this.prisma.payment.update({
      where: { orderId },
      data: data as Parameters<typeof this.prisma.payment.update>[0]['data'],
    });
  }
}
