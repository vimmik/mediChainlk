import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayHereAdapter } from './adapters/payhere.adapter';
import { WebxpayAdapter } from './adapters/webxpay.adapter';

@Module({
  controllers: [PaymentController],
  providers: [
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
