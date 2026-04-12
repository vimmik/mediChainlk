import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

// Default screen permissions per role (must stay in sync with seed.ts)
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  system_admin: [
    'DASHBOARD_VIEW', 'ANALYTICS_VIEW', 'PHARMACY_MANAGE', 'USER_MANAGE',
    'PRESCRIPTION_VIEW', 'PRESCRIPTION_REVIEW', 'INVENTORY_VIEW', 'INVENTORY_MANAGE',
    'ORDER_VIEW', 'ORDER_MANAGE', 'BILLING_VIEW', 'BILLING_MANAGE',
    'AI_PIPELINE_VIEW', 'DELIVERY_MANAGE', 'GRN_MANAGE', 'MEDICINE_MANAGE', 'REPORTS_VIEW',
  ],
  pharmacy_admin: [
    'DASHBOARD_VIEW', 'ANALYTICS_VIEW', 'USER_MANAGE',
    'PRESCRIPTION_VIEW', 'PRESCRIPTION_REVIEW', 'INVENTORY_VIEW', 'INVENTORY_MANAGE',
    'ORDER_VIEW', 'ORDER_MANAGE', 'BILLING_VIEW', 'BILLING_MANAGE',
    'AI_PIPELINE_VIEW', 'DELIVERY_MANAGE', 'GRN_MANAGE', 'MEDICINE_MANAGE', 'REPORTS_VIEW',
  ],
  pharmacy_staff: [
    'DASHBOARD_VIEW', 'ANALYTICS_VIEW', 'PRESCRIPTION_VIEW', 'PRESCRIPTION_REVIEW',
    'INVENTORY_VIEW', 'INVENTORY_MANAGE', 'ORDER_VIEW', 'ORDER_MANAGE',
    'BILLING_VIEW', 'BILLING_MANAGE', 'AI_PIPELINE_VIEW', 'DELIVERY_MANAGE',
    'GRN_MANAGE', 'MEDICINE_MANAGE',
  ],
  customer: ['DASHBOARD_VIEW', 'ORDER_VIEW', 'PRESCRIPTION_VIEW'],
};

interface CallerContext {
  role: string;
  tenantId?: string | null;
  firebaseUid: string;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, tenantId: string) {
    return this.prisma.user.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(query: ListUsersQueryDto, caller: CallerContext) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};

    // pharmacy_admin can only see users under their own tenant
    if (caller.role === 'pharmacy_admin') {
      where.tenantId = caller.tenantId;
      // pharmacy_admin cannot see system_admins
      where.role = query.role && query.role !== 'system_admin' ? query.role : { not: 'system_admin' };
    } else {
      if (query.role) where.role = query.role;
      if (query.tenantId) where.tenantId = query.tenantId;
    }

    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { name: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, caller?: CallerContext) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        branchAssignments: {
          include: {
            branch: { select: { id: true, name: true, city: true } },
          },
        },
        diseases: { include: { disease: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // pharmacy_admin can only view users from their own tenant
    if (caller?.role === 'pharmacy_admin' && user.tenantId !== caller.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({ where: { firebaseUid } });
  }

  async update(id: string, dto: UpdateUserDto, caller?: CallerContext) {
    const existing = await this.findById(id, caller);

    // pharmacy_admin cannot escalate user to system_admin
    if (caller?.role === 'pharmacy_admin' && dto.role === 'system_admin') {
      throw new ForbiddenException('Cannot assign system_admin role');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.birthday) data.birthday = new Date(dto.birthday);

    // If role is changing, sync Firebase Custom Claims
    if (dto.role && dto.role !== existing.role) {
      const fbUser = await admin.auth().getUser(existing.firebaseUid).catch(() => null);
      if (fbUser) {
        const currentClaims = fbUser.customClaims ?? {};
        await admin.auth().setCustomUserClaims(existing.firebaseUid, {
          ...currentClaims,
          role: dto.role,
          tenantId: dto.tenantId ?? currentClaims['tenantId'] ?? null,
          permissions: DEFAULT_PERMISSIONS[dto.role] ?? [],
        });
      }
    }

    return this.prisma.user.update({ where: { id }, data });
  }

  async deactivate(id: string, caller?: CallerContext) {
    const user = await this.findById(id, caller);

    // Prevent deactivating self
    if (user.firebaseUid === caller?.firebaseUid) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    await admin.auth().updateUser(user.firebaseUid, { disabled: true }).catch(() => null);
    return this.prisma.user.findUnique({ where: { id } });
  }

  async reactivate(id: string, caller?: CallerContext) {
    const user = await this.findById(id, caller);
    await this.prisma.user.update({ where: { id }, data: { isActive: true } });
    await admin.auth().updateUser(user.firebaseUid, { disabled: false }).catch(() => null);
    return this.prisma.user.findUnique({ where: { id } });
  }

  async hardDelete(id: string, caller?: CallerContext) {
    const user = await this.findById(id, caller);

    // Prevent deleting the last system_admin
    if (user.role === 'system_admin') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'system_admin', isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last system admin');
      }
    }

    await admin.auth().deleteUser(user.firebaseUid).catch(() => null);
    await this.prisma.user.delete({ where: { id } });
  }

  async invite(dto: InviteUserDto, caller: CallerContext) {
    // pharmacy_admin can only invite users to their own tenant
    if (caller.role === 'pharmacy_admin') {
      if (dto.role === 'system_admin' || dto.role === 'pharmacy_admin') {
        throw new ForbiddenException('pharmacy_admin cannot invite admins');
      }
      // Force tenantId to be their own tenant
      dto.tenantId = caller.tenantId ?? undefined;
    }

    // Create Firebase user
    const firebaseUser = await admin.auth().createUser({
      email: dto.email,
      password: dto.password,
      displayName: [dto.firstName, dto.lastName].filter(Boolean).join(' '),
    });

    // Set Custom Claims
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: dto.role,
      tenantId: dto.tenantId ?? null,
      permissions: DEFAULT_PERMISSIONS[dto.role] ?? [],
    });

    // Create DB record
    return this.prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        tenantId: dto.tenantId ?? null,
        isActive: true,
      },
    });
  }
}
