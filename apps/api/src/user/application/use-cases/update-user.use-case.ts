import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { USER_REPOSITORY, type CallerContext, type IUserRepository } from '../../domain/repositories/user.repository';
import { DEFAULT_PERMISSIONS } from '../../domain/user.constants';
import type { UpdateUserDto } from '../../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(id: string, dto: UpdateUserDto, caller?: CallerContext) {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new NotFoundException('User not found');

    if (caller?.role === 'pharmacy_admin' && existing.tenantId !== caller.tenantId) {
      throw new ForbiddenException('Access denied');
    }
    if (caller?.role === 'pharmacy_admin' && dto.role === 'system_admin') {
      throw new ForbiddenException('Cannot assign system_admin role');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.birthday) data.birthday = new Date(dto.birthday);

    if (dto.role && dto.role !== existing.role) {
      const fbUser = await admin.auth().getUser(existing.firebaseUid).catch(() => null);
      if (fbUser) {
        const currentClaims = (fbUser.customClaims ?? {}) as Record<string, unknown>;
        await admin.auth().setCustomUserClaims(existing.firebaseUid, {
          ...currentClaims,
          role: dto.role,
          tenantId: dto.tenantId ?? currentClaims['tenantId'] ?? null,
          permissions: DEFAULT_PERMISSIONS[dto.role] ?? [],
        });
      }
    }

    return this.userRepo.update(id, data);
  }
}
