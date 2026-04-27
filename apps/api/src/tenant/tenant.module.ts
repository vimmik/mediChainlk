import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BranchUseCase } from './application/use-cases/branch.use-case';
import { CreateTenantUseCase } from './application/use-cases/create-tenant.use-case';
import { GetTenantUseCase } from './application/use-cases/get-tenant.use-case';
import { ProvisionTenantUseCase } from './application/use-cases/provision-tenant.use-case';
import { StaffAssignmentUseCase } from './application/use-cases/staff-assignment.use-case';
import { TenantContactsUseCase } from './application/use-cases/tenant-contacts.use-case';
import { TenantDocumentsUseCase } from './application/use-cases/tenant-documents.use-case';
import { TenantOwnerUseCase } from './application/use-cases/tenant-owner.use-case';
import { UpdateTenantUseCase } from './application/use-cases/update-tenant.use-case';
import { USER_QUERY_PORT } from './domain/ports/user-query.port';
import { BRANCH_REPOSITORY } from './domain/repositories/branch.repository';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository';
import { PrismaBranchRepository } from './infrastructure/prisma-branch.repository';
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository';
import { TenantController } from './tenant.controller';

@Module({
  controllers: [TenantController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    { provide: BRANCH_REPOSITORY, useClass: PrismaBranchRepository },
    {
      provide: USER_QUERY_PORT,
      useFactory: (prisma: PrismaService) => ({
        findById: (userId: string) =>
          prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, tenantId: true, role: true },
          }),
      }),
      inject: [PrismaService],
    },
    CreateTenantUseCase,
    ProvisionTenantUseCase,
    GetTenantUseCase,
    UpdateTenantUseCase,
    TenantOwnerUseCase,
    TenantContactsUseCase,
    TenantDocumentsUseCase,
    BranchUseCase,
    StaffAssignmentUseCase,
  ],
})
export class TenantModule {}
