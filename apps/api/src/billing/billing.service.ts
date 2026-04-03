import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(dto: CreateInvoiceDto, tenantId: string) {
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal + (dto.deliveryFee || 0);

    return this.prisma.order.create({
      data: {
        tenantId,
        pharmacyId: dto.pharmacyId,
        customerId: dto.customerId,
        prescriptionId: dto.prescriptionId,
        status: 'PENDING_PAYMENT',
        subtotal: new Decimal(subtotal),
        deliveryFee: new Decimal(dto.deliveryFee || 0),
        total: new Decimal(total),
        items: {
          create: dto.items.map((item) => ({
            tenantId,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(item.quantity * item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });
  }
}
