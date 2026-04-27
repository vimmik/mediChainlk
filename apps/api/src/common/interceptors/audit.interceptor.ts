import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
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

// Map path segments → entity type label
const ENTITY_TYPE_MAP: Array<[RegExp, string]> = [
  [/\/branches\/[^/]+\/staff/, 'BranchAssignment'],
  [/\/branches/,               'PharmacyBranch'],
  [/\/tenants/,                'Tenant'],
  [/\/users/,                  'User'],
  [/\/permissions/,            'Permission'],
  [/\/documents/,              'TenantDocument'],
  [/\/contacts/,               'TenantContact'],
  [/\/owner/,                  'TenantOwner'],
];

function deriveEntityType(path: string): string {
  for (const [pattern, label] of ENTITY_TYPE_MAP) {
    if (pattern.test(path)) return label;
  }
  return 'Unknown';
}

function deriveAction(method: string, path: string, entityType: string): string {
  if (path.includes('/deactivate'))   return `${entityType}_DEACTIVATED`;
  if (path.includes('/reactivate'))   return `${entityType}_REACTIVATED`;
  if (path.includes('/verify'))       return `${entityType}_VERIFIED`;
  if (path.includes('/unverify'))     return `${entityType}_UNVERIFIED`;
  if (path.includes('/invite'))       return 'User_INVITED';
  if (path.includes('/role/'))        return 'PERMISSION_CHANGED';
  if (path.includes('/staff') && method === 'POST')   return 'BranchAssignment_CREATED';
  if (path.includes('/staff') && method === 'DELETE') return 'BranchAssignment_DELETED';
  return `${entityType}_${METHOD_ACTION_MAP[method] ?? method}`;
}

/**
 * Audit interceptor — fires on every mutating HTTP request.
 *
 * Fire-and-forget strategy is intentional for latency: we never block the
 * main response for audit writes. However, failures are now surfaced via the
 * Logger (error level) so they appear in CloudWatch / structured logs, rather
 * than being silently swallowed.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      path: string;
      params: Record<string, string>;
      headers: Record<string, string | string[] | undefined>;
      socket: { remoteAddress?: string };
      user?: { uid: string; role?: string; tenantId?: string | null };
    }>();

    const method: string = request.method;

    // Only audit mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    if (!user?.uid) return next.handle();

    const path: string = request.path ?? '';
    const entityType = deriveEntityType(path);
    const action = deriveAction(method, path, entityType);

    // Best-effort entity ID: prefer the last meaningful path segment
    const segments = path.split('/').filter(Boolean);
    const entityId: string = request.params?.id
      ?? request.params?.branchId
      ?? request.params?.contactId
      ?? request.params?.documentId
      ?? request.params?.userId
      ?? segments[segments.length - 1]
      ?? 'unknown';

    const xForwardedFor = request.headers['x-forwarded-for'];
    const ipAddress: string =
      (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor)
        ?.split(',')[0]
        ?.trim()
      ?? request.socket?.remoteAddress
      ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          // Success — persist audit entry asynchronously
          this.prisma.auditLog
            .create({
              data: {
                actorUid:   user.uid,
                actorRole:  user.role ?? 'unknown',
                tenantId:   user.tenantId ?? null,
                action,
                entityType,
                entityId,
                before:     Prisma.JsonNull,
                after:      Prisma.JsonNull,
                ipAddress,
              },
            })
            .catch((err: unknown) => {
              // Never let an audit failure crash the app, but always surface it
              // so on-call can detect persistent audit DB failures.
              this.logger.error(
                `Audit log write failed [${action} on ${entityType}:${entityId}]`,
                err instanceof Error ? err.stack : String(err),
              );
            });
        },
        // Do NOT audit failed requests — the action didn't complete
      }),
    );
  }
}
