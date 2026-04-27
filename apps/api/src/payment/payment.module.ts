import { Module } from '@nestjs/common';
import { PayHereAdapter } from './adapters/payhere.adapter';
import { WebxpayAdapter } from './adapters/webxpay.adapter';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  providers: [
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
    PaymentService,
    PayHereAdapter,
    WebxpayAdapter,
    {
      provide: 'PAYMENT_ADAPTERS',
      useFactory: (payhere: PayHereAdapter, webxpay: WebxpayAdapter) => ({
        PAYHERE: payhere,
        WEBXPAY: webxpay,
      }),
      inject: [PayHereAdapter, WebxpayAdapter],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
