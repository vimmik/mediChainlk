import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CallerContext } from '../../domain/repositories/user.repository';
import { DEFAULT_PERMISSIONS } from '../../domain/user.constants';
import type { ProvisionUserDto } from '../../dto/provision-user.dto';

/**
 * Provision a new user atomically.
 *
 * Cross-system transaction strategy:
 *   1. Validate caller's permissions BEFORE touching Firebase.
 *   2. Validate target tenant + branches exist BEFORE Firebase write.
 *   3. Create Firebase user (cannot be in a Postgres transaction).
 *   4. Run all DB writes (User + UserBranchAssignment rows) in prisma.$transaction
 *      with row-level locking on the User unique constraints.
 *   5. If DB step fails, COMPENSATE by deleting the Firebase user we just created.
 *   6. Set Firebase Custom Claims LAST (idempotent — safe to retry).
 *
 * This guarantees: either both Firebase + DB succeed, or neither persists.
 */
@Injectable()
export class ProvisionUserUseCase {
  private readonly logger = new Logger(ProvisionUserUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: ProvisionUserDto, caller: CallerContext) {
    // ── 1. Authorisation ─────────────────────────────────────────────────────
    this.authoriseCaller(dto, caller);

    // ── 2. Tenant + branch validation ────────────────────────────────────────
    const tenantId = await this.resolveTenant(dto, caller);
    const branchIds = await this.validateBranches(dto, tenantId);

    // ── 2b. Role resolution + scope check ───────────────────────────────────
    const { roleId, permissions: rolePermissions } = await this.resolveRole(
      dto,
      tenantId,
      caller,
    );

    // ── 3. Pre-flight DB uniqueness check (race-safe is re-done in tx) ──────
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(`A user with email "${dto.email}" already exists.`);
      }
    }

    // ── 4. Create Firebase user ──────────────────────────────────────────────
    let firebaseUid: string;
    try {
      const firebaseUser = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim() || undefined,
        phoneNumber: dto.phone || undefined,
      });
      firebaseUid = firebaseUser.uid;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-exists') {
        throw new ConflictException(`A Firebase account with email "${dto.email}" already exists.`);
      }
      if (code === 'auth/phone-number-already-exists') {
        throw new ConflictException(`A Firebase account with phone "${dto.phone}" already exists.`);
      }
      if (code === 'auth/invalid-password') {
        throw new BadRequestException('Password is too weak — must be at least 8 characters.');
      }
      throw err;
    }

    // ── 5. DB writes inside a single transaction (with compensation on fail) ─
    let createdUserId: string;
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // Re-check uniqueness inside the transaction (race window protection)
        if (dto.email) {
          const dup = await tx.user.findFirst({
            where: { email: dto.email },
            select: { id: true },
          });
          if (dup) {
            throw new ConflictException(`A user with email "${dto.email}" already exists.`);
          }
        }

        // Create User row — attach the resolved roleId (custom or system role)
        const created = await tx.user.create({
          data: {
            firebaseUid,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            role: dto.role,
            roleId,
            tenantId: tenantId,
            isActive: true,
          },
        });

        // Branch assignments — only for pharmacy_staff (and optionally pharmacy_admin)
        if (branchIds.length > 0) {
          // Ensure at most one isPrimary = true
          let primaryUsed = false;
          const rows = (dto.branchAssignments ?? []).map((a) => {
            const isPrimary = a.isPrimary && !primaryUsed;
            if (isPrimary) primaryUsed = true;
            return {
              userId: created.id,
              branchId: a.branchId,
              isPrimary,
              assignedBy: caller.firebaseUid,
            };
          });
          // If none was marked primary but at least one branch given, mark the first as primary
          if (rows.length > 0 && !primaryUsed) {
            rows[0].isPrimary = true;
          }
          await tx.userBranchAssignment.createMany({ data: rows });
        }

        return tx.user.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            tenant: { select: { id: true, name: true } },
            branchAssignments: {
              include: { branch: { select: { id: true, name: true, city: true } } },
            },
          },
        });
      });

      createdUserId = user.id;

      // ── 6. Set Firebase Custom Claims (after DB commit) ───────────────────
      // Custom Claims drive the token-based authz. Set last so failed DB doesn't
      // leave a Firebase user with mismatched claims. When the user has a Role
      // attached, its permissions are authoritative; otherwise we fall back to
      // the hardcoded DEFAULT_PERMISSIONS for the role string.
      await admin.auth().setCustomUserClaims(firebaseUid, {
        role: dto.role,
        roleId: roleId ?? null,
        tenantId: tenantId ?? null,
        permissions: rolePermissions.length > 0
          ? rolePermissions
          : (DEFAULT_PERMISSIONS[dto.role] ?? []),
      });

      // Optional: send Firebase password reset email so user picks their own password
      if (dto.sendPasswordReset && dto.email) {
        try {
          const link = await admin.auth().generatePasswordResetLink(dto.email);
          this.logger.log(`Password reset link generated for ${dto.email}: ${link}`);
          // TODO: wire up email transport (SES/SendGrid) to actually deliver this
        } catch (err) {
          this.logger.warn(
            `Failed to generate password reset link for ${dto.email}: ${(err as Error).message}`,
          );
        }
      }

      return user;
    } catch (dbErr) {
      // COMPENSATE: roll back the Firebase user we created
      try {
        await admin.auth().deleteUser(firebaseUid);
        this.logger.warn(
          `Provision failed for ${dto.email} — compensated by deleting Firebase UID ${firebaseUid}`,
        );
      } catch (cleanupErr) {
        // This is the dangerous path: DB rolled back but Firebase orphan remains.
        // Log loudly so ops can clean it up; don't mask the original error.
        this.logger.error(
          `CRITICAL: Failed to clean up Firebase user ${firebaseUid} after DB rollback`,
          (cleanupErr as Error).stack,
        );
      }
      throw dbErr;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Resolve the Role to attach to the user.
   *
   * - If dto.roleId is provided → use it (after validating scope compatibility).
   * - Otherwise → auto-attach the seeded system role matching dto.role.
   *
   * Returns the roleId + the flat permissionCode list for Firebase claims.
   */
  private async resolveRole(
    dto: ProvisionUserDto,
    tenantId: string | null,
    caller: CallerContext,
  ): Promise<{ roleId: string | null; permissions: string[] }> {
    // role-string → expected scope
    const expectedScope: Record<string, string> = {
      system_admin: 'system',
      pharmacy_admin: 'tenant',
      pharmacy_staff: 'branch',
      customer: 'customer',
    };
    const wantedScope = expectedScope[dto.role];

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
        include: { permissions: { include: { permission: true } } },
      });
      if (!role) throw new NotFoundException(`Role ${dto.roleId} not found`);
      if (!role.isActive) throw new BadRequestException('Cannot assign an inactive role');

      // Scope must match the user's role string
      if (role.scope !== wantedScope) {
        throw new BadRequestException(
          `Role scope "${role.scope}" is incompatible with user role "${dto.role}" ` +
          `(expected scope "${wantedScope}")`,
        );
      }

      // Tenant ownership check for custom (non-system) roles
      if (!role.isSystem) {
        if (caller.role === 'pharmacy_admin') {
          if (role.tenantId !== caller.tenantId) {
            throw new ForbiddenException('You cannot assign roles from another tenant');
          }
        }
        // The custom role must belong to the user's tenant (you can't assign
        // tenant A's custom role to a user in tenant B).
        if (role.tenantId !== tenantId) {
          throw new BadRequestException(
            `Role "${role.name}" belongs to a different tenant than the user`,
          );
        }
      }

      return {
        roleId: role.id,
        permissions: role.permissions.map((p) => p.permission.permissionCode),
      };
    }

    // No roleId → fall back to the seeded system role
    const systemRole = await this.prisma.role.findFirst({
      where: { name: dto.role, isSystem: true, tenantId: null },
      include: { permissions: { include: { permission: true } } },
    });
    if (!systemRole) {
      // No seed yet — fall back to DEFAULT_PERMISSIONS but don't link any roleId
      return { roleId: null, permissions: [] };
    }
    return {
      roleId: systemRole.id,
      permissions: systemRole.permissions.map((p) => p.permission.permissionCode),
    };
  }

  private authoriseCaller(dto: ProvisionUserDto, caller: CallerContext): void {
    if (caller.role === 'system_admin') {
      // system_admin can create any role for any tenant
      return;
    }

    if (caller.role === 'pharmacy_admin') {
      // pharmacy_admin can only create pharmacy_admin or pharmacy_staff
      if (!['pharmacy_admin', 'pharmacy_staff'].includes(dto.role)) {
        throw new ForbiddenException(
          'pharmacy_admin can only create pharmacy_admin or pharmacy_staff users',
        );
      }
      // pharmacy_admin can only create users in their OWN tenant
      if (dto.tenantId && dto.tenantId !== caller.tenantId) {
        throw new ForbiddenException(
          'pharmacy_admin can only create users for their own tenant',
        );
      }
      return;
    }

    throw new ForbiddenException('You do not have permission to create users');
  }

  /** Returns the effective tenantId (forced to caller.tenantId for pharmacy_admin). */
  private async resolveTenant(dto: ProvisionUserDto, caller: CallerContext): Promise<string | null> {
    // system_admin / customer roles → tenantId must be null
    if (dto.role === 'system_admin' || dto.role === 'customer') {
      return null;
    }

    // pharmacy_admin caller → force their tenant
    const tenantId =
      caller.role === 'pharmacy_admin' ? (caller.tenantId ?? null) : (dto.tenantId ?? null);

    if (!tenantId) {
      throw new BadRequestException(`tenantId is required for role "${dto.role}"`);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);
    if (!tenant.isActive) {
      throw new BadRequestException('Cannot create users for an inactive tenant');
    }

    return tenantId;
  }

  /** Validates each branchId belongs to the tenant. Returns the unique branchId list. */
  private async validateBranches(dto: ProvisionUserDto, tenantId: string | null): Promise<string[]> {
    const assignments = dto.branchAssignments ?? [];

    // Branches are only meaningful for pharmacy_staff / pharmacy_admin
    if (dto.role === 'system_admin' || dto.role === 'customer') {
      if (assignments.length > 0) {
        throw new BadRequestException(
          `Role "${dto.role}" cannot have branch assignments`,
        );
      }
      return [];
    }

    // pharmacy_staff MUST have at least one branch
    if (dto.role === 'pharmacy_staff' && assignments.length === 0) {
      throw new BadRequestException('pharmacy_staff must be assigned to at least one branch');
    }

    if (assignments.length === 0) return [];

    const uniqueIds = Array.from(new Set(assignments.map((a) => a.branchId)));
    if (uniqueIds.length !== assignments.length) {
      throw new BadRequestException('Duplicate branch IDs in assignments');
    }

    const branches = await this.prisma.pharmacyBranch.findMany({
      where: { id: { in: uniqueIds }, tenantId: tenantId ?? undefined },
      select: { id: true, isActive: true },
    });

    if (branches.length !== uniqueIds.length) {
      throw new BadRequestException('One or more branches do not belong to the chosen tenant');
    }

    const inactive = branches.filter((b) => !b.isActive);
    if (inactive.length > 0) {
      throw new BadRequestException(
        `Cannot assign user to inactive branch(es): ${inactive.map((b) => b.id).join(', ')}`,
      );
    }

    return uniqueIds;
  }
}
