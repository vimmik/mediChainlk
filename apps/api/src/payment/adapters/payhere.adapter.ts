import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentAdapter,
  PaymentAuthRequest,
  PaymentAuthResponse,
} from './payment-adapter.interface';

@Injectable()
export class PayHereAdapter implements IPaymentAdapter {
  private readonly merchantId: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get('PAYHERE_MERCHANT_ID') || '';
    const isSandbox = this.configService.get('PAYHERE_SANDBOX') === 'true';
    this.baseUrl = isSandbox ? 'https://sandbox.payhere.lk' : 'https://www.payhere.lk';
  }

  async authorizePayment(request: PaymentAuthRequest): Promise<PaymentAuthResponse> {
    // In production, this would call PayHere's checkout API
    // PayHere uses a redirect-based flow where the checkout URL is constructed
    const checkoutUrl = `${this.baseUrl}/pay/checkout`;

    return {
      providerOrderId: `PH-${request.orderId}`,
      checkoutUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    };
  }

  async capturePayment(providerOrderId: string): Promise<{ success: boolean }> {
    // PayHere Auth & Capture: capture the previously authorized amount
    // POST to PayHere capture endpoint
    return { success: true };
  }

  async refund(providerPaymentId: string, amount?: number): Promise<{ success: boolean }> {
    // POST to PayHere refund API
    return { success: true };
  }
}
