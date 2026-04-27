import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { IBillingRepository, OrderCreateData } from '../domain/repositories/billing.repository';

@Injectable()
export class PrismaBillingRepository implements IBillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: OrderCreateData) {
    return this.prisma.order.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        customerId: data.customerId,
        prescriptionId: data.prescriptionId,
        status: 'PENDING_PAYMENT',
        subtotal: new Decimal(data.subtotal),
        deliveryFee: new Decimal(data.deliveryFee),
        total: new Decimal(data.total),
        items: {
          create: data.items.map((item) => ({
            tenantId: item.tenantId,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(item.total),
          })),
        },
      },
      include: { items: true },
    });
  }
}
