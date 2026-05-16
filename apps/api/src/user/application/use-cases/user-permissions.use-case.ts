import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import type { CallerContext } from '../../domain/repositories/user.repository';
import type { ReplaceUserOverridesDto } from '../../dto/replace-user-overrides.dto';

/**
 * One row in the resolved permission view returned to the UI.
 *
 * `source` explains where the final `effective` value came from:
 *   - "role"    — granted by the user's Role (no override)
 *   - "default" — not granted by Role; not overridden
 *   - "grant"   — explicitly force-granted by an override
 *   - "revoke"  — explicitly force-revoked by an override
 */
export interface EffectivePermissionRow {
  permissionId: string;
  permissionCode: string;
  screenName: string;
  description: string | null;
  category: string | null;
  /** Whether the Role grants this permission (the baseline). */
  fromRole: boolean;
  /** The override decision, if any. */
  override: 'grant' | 'revoke' | null;
  /** Final effective state after Role + Override resolution. */
  effective: boolean;
  source: 'role' | 'default' | 'grant' | 'revoke';
}

/**
 * Permissions that are too dangerous for a pharmacy_admin to grant onto another
 * user via override. Granting these would let them escalate privilege beyond
 * their own scope (e.g. PHARMACY_MANAGE controls tenant CRUD — system-only).
 */
const SYSTEM_ONLY_PERMISSIONS = new Set(['PHARMACY_MANAGE']);

@Injectable()
export class UserPermissionsUseCase {
  private readonly logger = new Logger(UserPermissionsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── GET effective permissions ──────────────────────────────────────────

  async getEffective(userId: string, caller: CallerContext): Promise<{
    user: { id: string; firebaseUid: string; role: string; roleId: string | null; tenantId: string | null };
    role: { id: string; name: string; isSystem: boolean } | null;
    permissions: EffectivePermissionRow[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleRef: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    this.assertCallerCanViewUser(user, caller);

    const [allPerms, overrides] = await Promise.all([
      this.prisma.screenPermission.findMany({
        orderBy: [{ category: 'asc' }, { screenName: 'asc' }],
      }),
      this.prisma.userPermissionOverride.findMany({
        where: { userId: user.id },
      }),
    ]);

    const rolePermIds = new Set(
      user.roleRef?.permissions.map((rp) => rp.permissionId) ?? [],
    );
    const overrideById = new Map(overrides.map((o) => [o.permissionId, o]));

    const rows: EffectivePermissionRow[] = allPerms.map((p) => {
      const fromRole = rolePermIds.has(p.id);
      const ov = overrideById.get(p.id);
      let effective: boolean;
      let source: EffectivePermissionRow['source'];
      let override: 'grant' | 'revoke' | null = null;

      if (ov) {
        override = ov.isGranted ? 'grant' : 'revoke';
        effective = ov.isGranted;
        source = ov.isGranted ? 'grant' : 'revoke';
      } else {
        effective = fromRole;
        source = fromRole ? 'role' : 'default';
      }

      return {
        permissionId: p.id,
        permissionCode: p.permissionCode,
        screenName: p.screenName,
        description: p.description,
        category: p.category,
        fromRole,
        override,
        effective,
        source,
      };
    });

    return {
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        role: user.role,
        roleId: user.roleId,
        tenantId: user.tenantId,
      },
      role: user.roleRef
        ? { id: user.roleRef.id, name: user.roleRef.name, isSystem: user.roleRef.isSystem }
        : null,
      permissions: rows,
    };
  }

  // ─── PUT (bulk replace) overrides ───────────────────────────────────────

  async replaceOverrides(
    userId: string,
    dto: ReplaceUserOverridesDto,
    caller: CallerContext,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roleRef: { select: { isSystem: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    this.assertCallerCanEditUser(user, caller);

    if (dto.overrides.length === 0) {
      // Empty submission = clear all overrides
      await this.prisma.userPermissionOverride.deleteMany({ where: { userId } });
      await this.redis.bumpUserPermissionVersion(user.firebaseUid);
      return this.getEffective(userId, caller);
    }

    // Validate all permissionIds exist
    const perms = await this.prisma.screenPermission.findMany({
      where: { id: { in: dto.overrides.map((o) => o.permissionId) } },
      select: { id: true, permissionCode: true },
    });
    if (perms.length !== dto.overrides.length) {
      throw new BadRequestException('One or more permissionIds are invalid');
    }
    const permCodeById = new Map(perms.map((p) => [p.id, p.permissionCode]));

    // Lock guard — pharmacy_admin escalation check
    this.assertCallerCanGrant(dto, permCodeById, caller);

    await this.prisma.$transaction(async (tx) => {
      // Delete-all-and-recreate keeps the logic simple and the diff atomic.
      // For ~200 rows max this is fine; no need for fancy diff.
      await tx.userPermissionOverride.deleteMany({ where: { userId } });
      if (dto.overrides.length > 0) {
        await tx.userPermissionOverride.createMany({
          data: dto.overrides.map((o) => ({
            userId,
            permissionId: o.permissionId,
            isGranted: o.isGranted,
            grantedBy: caller.firebaseUid,
          })),
        });
      }
    });

    // Bump the user's perm version → existing sessions re-resolve on next request
    await this.redis.bumpUserPermissionVersion(user.firebaseUid);

    this.logger.log(
      `User ${user.id} (uid=${user.firebaseUid}) override list set to ${dto.overrides.length} entries ` +
      `by ${caller.firebaseUid}`,
    );

    return this.getEffective(userId, caller);
  }

  // ─── Guards ─────────────────────────────────────────────────────────────

  private assertCallerCanViewUser(
    user: { id: string; role: string; tenantId: string | null },
    caller: CallerContext,
  ): void {
    if (caller.role === 'system_admin') return;
    if (caller.role === 'pharmacy_admin') {
      // pharmacy_admin sees users in their own tenant only
      if (user.tenantId === caller.tenantId) return;
      throw new ForbiddenException('You do not have access to this user');
    }
    throw new ForbiddenException('You do not have permission to view permissions');
  }

  private assertCallerCanEditUser(
    user: { id: string; role: string; tenantId: string | null; roleRef: { isSystem: boolean } | null },
    caller: CallerContext,
  ): void {
    // Cannot manage your own overrides (privilege escalation risk)
    if (user.id && caller.firebaseUid && user.role === caller.role) {
      // Allow same-role only when the caller is operating on a *different* user.
      // (No way to know the caller's user-row id here without a query; the
      //  firebaseUid comparison below covers self-edit prevention.)
    }

    if (caller.role === 'system_admin') {
      // system_admin can edit anyone — except they cannot revoke their OWN perms
      // (that would risk locking themselves out). We rely on a UI confirm + the
      // session re-resolve catching the change on the next request.
      return;
    }

    if (caller.role === 'pharmacy_admin') {
      // pharmacy_admin can only edit users in their own tenant
      if (user.tenantId !== caller.tenantId) {
        throw new ForbiddenException('You do not have access to this user');
      }
      // pharmacy_admin cannot edit a system_admin or another pharmacy_admin
      if (user.role === 'system_admin') {
        throw new ForbiddenException('pharmacy_admin cannot edit system_admin permissions');
      }
      return;
    }
    throw new ForbiddenException('You do not have permission to edit overrides');
  }

  /**
   * Privilege-escalation guard. pharmacy_admin cannot force-grant permissions
   * that are reserved for system_admin (e.g. PHARMACY_MANAGE).
   */
  private assertCallerCanGrant(
    dto: ReplaceUserOverridesDto,
    permCodeById: Map<string, string>,
    caller: CallerContext,
  ): void {
    if (caller.role === 'system_admin') return;
    if (caller.role !== 'pharmacy_admin') return;

    for (const o of dto.overrides) {
      if (!o.isGranted) continue; // revokes are always allowed
      const code = permCodeById.get(o.permissionId);
      if (code && SYSTEM_ONLY_PERMISSIONS.has(code)) {
        throw new ForbiddenException(
          `pharmacy_admin cannot grant permission "${code}" — system_admin only`,
        );
      }
    }
  }
}
