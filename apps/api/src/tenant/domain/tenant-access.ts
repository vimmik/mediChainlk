import { ForbiddenException } from '@nestjs/common';

export interface TenantCallerContext {
  role: string;
  tenantId: string | null;
}

export function assertTenantAccess(caller: TenantCallerContext, targetTenantId: string): void {
  if (caller.role === 'system_admin') return;
  if (caller.tenantId !== targetTenantId) {
    throw new ForbiddenException('You do not have access to this tenant');
  }
}
