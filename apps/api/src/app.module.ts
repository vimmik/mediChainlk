import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PrescriptionModule } from './prescription/prescription.module';
import { InventoryModule } from './inventory/inventory.module';
import { BillingModule } from './billing/billing.module';
import { PaymentModule } from './payment/payment.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NotificationModule } from './notification/notification.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PrescriptionModule,
    InventoryModule,
    BillingModule,
    PaymentModule,
    DeliveryModule,
    NotificationModule,
    TenantModule,
    UserModule,
    HealthModule,
  ],
})
export class AppModule {}
