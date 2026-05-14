import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import Redis from 'ioredis';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { AuthModule } from './auth/auth.module';
import { PrescriptionModule } from './prescription/prescription.module';
import { InventoryModule } from './inventory/inventory.module';
import { BillingModule } from './billing/billing.module';
import { PaymentModule } from './payment/payment.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NotificationModule } from './notification/notification.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { HealthModule } from './health/health.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    // Distributed rate limiting: shared Redis storage so limits are enforced
    // across all API instances behind the load balancer. Without Redis, an
    // attacker could exploit per-instance counters by load-balancing their attack.
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [
          { name: 'global', ttl: 60_000, limit: 100 },
          { name: 'auth', ttl: 60_000, limit: 10 },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
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
    RoleModule,
    HealthModule,
    PermissionsModule,
  ],
  providers: [
    // Apply throttler globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
