import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const METHOD_ACTION_MAP: Record<string, string> = {
  POST:   'CREATED',
  PUT:    'UPDATED',
  PATCH:  'UPDATED',
  DELETE: 'DELETED',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    // Only audit mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    if (!user?.uid) return next.handle();

    const entityId: string = request.params?.id ?? 'unknown';
    const path: string = request.path ?? '';

    // Derive entity type from route path
    let entityType = 'Unknown';
    if (path.includes('/users')) entityType = 'User';
    else if (path.includes('/permissions')) entityType = 'Permission';
    else if (path.includes('/tenants')) entityType = 'Tenant';

    // Derive action from method + path suffix
    let action = `${entityType}_${METHOD_ACTION_MAP[method] ?? method}`;
    if (path.includes('/deactivate')) action = 'User_DEACTIVATED';
    else if (path.includes('/reactivate')) action = 'User_REACTIVATED';
    else if (path.includes('/invite')) action = 'User_INVITED';
    else if (path.includes('/role/')) action = 'PERMISSION_CHANGED';

    const ipAddress: string =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
      request.socket?.remoteAddress ??
      'unknown';

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget — don't block the response
        this.prisma.auditLog
          .create({
            data: {
              actorUid: user.uid,
              actorRole: user.role ?? 'unknown',
              tenantId: user.tenantId ?? null,
              action,
              entityType,
              entityId,
              before: Prisma.JsonNull,
              after: Prisma.JsonNull,
              ipAddress,
            },
          })
          .catch(() => {
            // Silently ignore audit failures — never break the main request
          });
      }),
    );
  }
}
