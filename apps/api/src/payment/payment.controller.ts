import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(dto);
  }

  @Post('webhook/payhere')
  payhereWebhook(@Body() body: Record<string, unknown>) {
    return this.paymentService.handlePayHereWebhook(body);
  }

  @Post('webhook/webxpay')
  webxpayWebhook(@Body() body: Record<string, unknown>) {
    return this.paymentService.handleWebxpayWebhook(body);
  }
}
