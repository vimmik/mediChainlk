import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.screenPermission.findMany({
      orderBy: { screenName: 'asc' },
    });
  }

  async findByRole(role: string) {
    const [allPerms, roleMappings] = await Promise.all([
      this.prisma.screenPermission.findMany({ orderBy: { screenName: 'asc' } }),
      this.prisma.userTypePermission.findMany({
        where: { userTypeCode: role },
        include: { permission: true },
      }),
    ]);

    return allPerms.map((p) => ({
      ...p,
      isEnabled: roleMappings.find((m) => m.permissionId === p.id)?.isEnabled ?? false,
    }));
  }

  async updateRolePermissions(role: string, dto: UpdateRolePermissionsDto) {
    await Promise.all(
      dto.updates.map((u) =>
        this.prisma.userTypePermission.upsert({
          where: {
            userTypeCode_permissionId: {
              userTypeCode: role,
              permissionId: u.permissionId,
            },
          },
          create: {
            userTypeCode: role,
            permissionId: u.permissionId,
            isEnabled: u.isEnabled,
          },
          update: { isEnabled: u.isEnabled },
        }),
      ),
    );

    // Bump the version so active sessions for this role re-resolve permissions
    // on their next request instead of carrying stale data for up to 8 hours.
    await this.redis.bumpRolePermissionVersion(role);

    return this.findByRole(role);
  }
}
