import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, ROLE_SCOPES, RoleScope } from './dto/create-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

export interface CallerContext {
  firebaseUid: string;
  role: string;
  tenantId?: string | null;
}

/**
 * Role management.
 *
 * Authorisation rules:
 *   system_admin    → can manage all roles (system + every tenant's custom)
 *   pharmacy_admin  → can manage their own tenant's roles only.
 *                     Cannot create roles with scope=system.
 *                     Cannot edit/delete isSystem=true roles.
 *   others          → no access (guarded at controller level)
 */
@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(query: ListRolesQueryDto, caller: CallerContext) {
    const where: Prisma.RoleWhereInput = {};

    // Tenant scoping
    if (caller.role === 'pharmacy_admin') {
      // pharmacy_admin sees: system roles + their tenant's custom roles
      where.OR = [
        { isSystem: true },
        { tenantId: caller.tenantId ?? undefined },
      ];
    } else if (caller.role === 'system_admin') {
      if (query.tenantId) {
        where.OR = [{ isSystem: true }, { tenantId: query.tenantId }];
      }
    } else {
      throw new ForbiddenException('You do not have permission to list roles');
    }

    if (query.scope) where.scope = query.scope;
    if (query.includeSystem === false) where.isSystem = false;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return this.prisma.role.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: { include: { permission: true } },
        tenant: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
    });
  }

  // ─── Get one ──────────────────────────────────────────────────────────────

  async findById(id: string, caller: CallerContext) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        tenant: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    this.assertRoleVisibleToCaller(role, caller);
    return role;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateRoleDto, caller: CallerContext) {
    if (!ROLE_SCOPES.includes(dto.scope as RoleScope)) {
      throw new BadRequestException(`Invalid scope: ${dto.scope}`);
    }

    // Authorise + resolve effective tenantId
    const tenantId = this.resolveTenantForWrite(dto.tenantId ?? null, caller, dto.scope);

    // Validate permissionIds exist
    const validPerms = await this.prisma.screenPermission.findMany({
      where: { id: { in: dto.permissionIds } },
      select: { id: true },
    });
    if (validPerms.length !== dto.permissionIds.length) {
      throw new BadRequestException('One or more permissionIds are invalid');
    }

    // Validate tenantId exists when set
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isActive: true },
      });
      if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);
      if (!tenant.isActive) throw new BadRequestException('Cannot create roles for an inactive tenant');
    }

    return this.prisma.$transaction(async (tx) => {
      // Conflict-check inside tx — row-level lock on (tenantId, name)
      const conflict = await tx.role.findFirst({
        where: { tenantId, name: dto.name },
      });
      if (conflict) {
        throw new ConflictException(`A role named "${dto.name}" already exists in this scope`);
      }

      const role = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          scope: dto.scope,
          isSystem: false, // user-created roles are never system
          tenantId,
          isActive: dto.isActive ?? true,
          createdBy: caller.firebaseUid,
          permissions: {
            create: dto.permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
        include: {
          permissions: { include: { permission: true } },
          tenant: { select: { id: true, name: true } },
        },
      });

      return role;
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateRoleDto, caller: CallerContext) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Role not found');

    this.assertRoleWritableByCaller(existing, caller);

    // Validate permissionIds if provided
    if (dto.permissionIds) {
      const validPerms = await this.prisma.screenPermission.findMany({
        where: { id: { in: dto.permissionIds } },
        select: { id: true },
      });
      if (validPerms.length !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permissionIds are invalid');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // If renaming, check for conflicts in the same tenant scope
      if (dto.name && dto.name !== existing.name) {
        const conflict = await tx.role.findFirst({
          where: { tenantId: existing.tenantId, name: dto.name, NOT: { id } },
        });
        if (conflict) {
          throw new ConflictException(`A role named "${dto.name}" already exists in this scope`);
        }
      }

      // Sync permissions if provided
      if (dto.permissionIds) {
        const existingLinks = await tx.rolePermission.findMany({ where: { roleId: id } });
        const existingIds = new Set(existingLinks.map((l) => l.permissionId));
        const desired = new Set(dto.permissionIds);

        const toAdd = dto.permissionIds.filter((pid) => !existingIds.has(pid));
        const toRemove = existingLinks.filter((l) => !desired.has(l.permissionId));

        if (toAdd.length > 0) {
          await tx.rolePermission.createMany({
            data: toAdd.map((permissionId) => ({ roleId: id, permissionId })),
            skipDuplicates: true,
          });
        }
        if (toRemove.length > 0) {
          await tx.rolePermission.deleteMany({
            where: { id: { in: toRemove.map((l) => l.id) } },
          });
        }
      }

      return tx.role.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          isActive: dto.isActive,
        },
        include: {
          permissions: { include: { permission: true } },
          tenant: { select: { id: true, name: true } },
          _count: { select: { users: true } },
        },
      });
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async delete(id: string, caller: CallerContext) {
    const existing = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) throw new NotFoundException('Role not found');

    if (existing.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    this.assertRoleWritableByCaller(existing, caller);

    if (existing._count.users > 0) {
      throw new ConflictException(
        `Cannot delete role "${existing.name}" — ${existing._count.users} user(s) still assigned. ` +
        `Reassign them first.`,
      );
    }

    // Soft-delete pattern: mark inactive instead of hard-deleting. Keeps audit history intact.
    await this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private assertRoleVisibleToCaller(
    role: { isSystem: boolean; tenantId: string | null },
    caller: CallerContext,
  ): void {
    if (caller.role === 'system_admin') return;
    if (caller.role === 'pharmacy_admin') {
      if (role.isSystem) return;
      if (role.tenantId === caller.tenantId) return;
      throw new ForbiddenException('You do not have access to this role');
    }
    throw new ForbiddenException('You do not have permission to view roles');
  }

  private assertRoleWritableByCaller(
    role: { isSystem: boolean; tenantId: string | null },
    caller: CallerContext,
  ): void {
    if (role.isSystem) {
      // Only system_admin can modify system roles (permissions can still be edited
      // — the assertion happens at controller level via @Roles). For now: only
      // system_admin can edit system role permissions.
      if (caller.role !== 'system_admin') {
        throw new ForbiddenException('Only system_admin can modify system roles');
      }
      return;
    }
    if (caller.role === 'system_admin') return;
    if (caller.role === 'pharmacy_admin' && role.tenantId === caller.tenantId) return;
    throw new ForbiddenException('You cannot modify this role');
  }

  /** Validate the requested tenantId vs caller + scope, returning the effective tenantId. */
  private resolveTenantForWrite(
    requestedTenantId: string | null,
    caller: CallerContext,
    scope: RoleScope,
  ): string | null {
    // pharmacy_admin is always locked to their own tenant
    if (caller.role === 'pharmacy_admin') {
      if (scope === 'system' || scope === 'customer') {
        throw new ForbiddenException('pharmacy_admin can only create tenant or branch scoped roles');
      }
      if (!caller.tenantId) {
        throw new BadRequestException('Your account has no tenant — cannot create tenant-scoped roles');
      }
      return caller.tenantId;
    }

    // system_admin
    if (caller.role === 'system_admin') {
      if (scope === 'system' || scope === 'customer') {
        // system roles are seed-only; you should not be creating new ones via API
        // but allow it anyway with tenantId=null
        return null;
      }
      // tenant/branch scope → must specify which tenant
      if (!requestedTenantId) {
        throw new BadRequestException(
          `tenantId is required when scope="${scope}"`,
        );
      }
      return requestedTenantId;
    }

    throw new ForbiddenException('You do not have permission to create roles');
  }
}
