import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BILLING_REPOSITORY } from './domain/repositories/billing.repository';
import { PrismaBillingRepository } from './infrastructure/prisma-billing.repository';

@Module({
  controllers: [BillingController],
  providers: [
    { provide: BILLING_REPOSITORY, useClass: PrismaBillingRepository },
    BillingService,
  ],
  exports: [BillingService],
})
export class BillingModule {}
