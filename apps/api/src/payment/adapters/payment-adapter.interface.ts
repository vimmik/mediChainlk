export interface PaymentAuthRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentAuthResponse {
  providerOrderId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface IPaymentAdapter {
  authorizePayment(request: PaymentAuthRequest): Promise<PaymentAuthResponse>;
  capturePayment(providerOrderId: string): Promise<{ success: boolean }>;
  refund(providerPaymentId: string, amount?: number): Promise<{ success: boolean }>;
}
