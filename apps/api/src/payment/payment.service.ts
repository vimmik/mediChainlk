import { Inject, Injectable } from '@nestjs/common';
import { IPaymentAdapter } from './adapters/payment-adapter.interface';
import { PAYMENT_REPOSITORY, type IPaymentRepository } from './domain/repositories/payment.repository';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject('PAYMENT_ADAPTERS') private readonly adapters: Record<string, IPaymentAdapter>,
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

    await this.paymentRepo.createPayment({
      tenantId: dto.tenantId,
      orderId: dto.orderId,
      provider: dto.provider,
      providerOrderId: authorization.providerOrderId,
      amount: dto.amount,
      status: 'AUTHORIZED',
      authorizedAt: new Date(),
    });

    return authorization;
  }

  async handlePayHereWebhook(body: Record<string, unknown>) {
    const orderId = body['order_id'] as string;
    const statusCode = body['status_code'] as string;

    if (statusCode === '2') {
      await this.paymentRepo.updateByOrderId(orderId, {
        status: 'CAPTURED',
        capturedAt: new Date(),
        metadata: body as Record<string, string>,
      });
    }

    return { received: true };
  }

  async handleWebxpayWebhook(_body: Record<string, unknown>) {
    return { received: true };
  }
}
