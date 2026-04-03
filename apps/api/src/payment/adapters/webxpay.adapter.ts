import { Injectable } from '@nestjs/common';
import {
  IPaymentAdapter,
  PaymentAuthRequest,
  PaymentAuthResponse,
} from './payment-adapter.interface';

@Injectable()
export class WebxpayAdapter implements IPaymentAdapter {
  async authorizePayment(request: PaymentAuthRequest): Promise<PaymentAuthResponse> {
    // WEBXPAY integration — backup payment gateway
    return {
      providerOrderId: `WX-${request.orderId}`,
      checkoutUrl: 'https://webxpay.com/checkout',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async capturePayment(providerOrderId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async refund(providerPaymentId: string, amount?: number): Promise<{ success: boolean }> {
    return { success: true };
  }
}
