import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { IPaymentAdapter } from './adapters/payment-adapter.interface';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    @Inject('PAYMENT_ADAPTERS')
    private adapters: Record<string, IPaymentAdapter>,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto) {
    const adapter = this.adapters[dto.provider];
    if (!adapter) {
      throw new Error(`Payment provider ${dto.provider} not supported`);
    }

    const authorization = await adapter.authorizePayment({
      orderId: dto.orderId,
      amount: dto.amount,
      currency: 'LKR',
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
    });

    await this.prisma.payment.create({
      data: {
        tenantId: dto.tenantId,
        orderId: dto.orderId,
        provider: dto.provider,
        providerOrderId: authorization.providerOrderId,
        amount: new Decimal(dto.amount),
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
      },
    });

    return authorization;
  }

  async handlePayHereWebhook(body: Record<string, unknown>) {
    // Process PayHere notification callback
    const orderId = body['order_id'] as string;
    const statusCode = body['status_code'] as string;

    if (statusCode === '2') {
      // Payment successful
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'CAPTURED', capturedAt: new Date(), metadata: body as Record<string, string> },
      });
    }

    return { received: true };
  }

  async handleWebxpayWebhook(body: Record<string, unknown>) {
    // Process WEBXPAY callback
    return { received: true };
  }
}
