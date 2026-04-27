import { Inject, Injectable } from '@nestjs/common';
import { BILLING_REPOSITORY, type IBillingRepository } from './domain/repositories/billing.repository';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class BillingService {
  constructor(@Inject(BILLING_REPOSITORY) private readonly billingRepo: IBillingRepository) {}

  async createInvoice(dto: CreateInvoiceDto, tenantId: string) {
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal + (dto.deliveryFee || 0);

    return this.billingRepo.createOrder({
      tenantId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      prescriptionId: dto.prescriptionId,
      subtotal,
      deliveryFee: dto.deliveryFee || 0,
      total,
      items: dto.items.map((item) => ({
        tenantId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    });
  }
}
