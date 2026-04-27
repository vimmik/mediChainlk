import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { USER_REPOSITORY, type CallerContext, type IUserRepository } from '../../domain/repositories/user.repository';
import { DEFAULT_PERMISSIONS } from '../../domain/user.constants';
import type { InviteUserDto } from '../../dto/invite-user.dto';

@Injectable()
export class InviteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(dto: InviteUserDto, caller: CallerContext) {
    if (caller.role === 'pharmacy_admin') {
      if (dto.role === 'system_admin' || dto.role === 'pharmacy_admin') {
        throw new ForbiddenException('pharmacy_admin cannot invite admins');
      }
      dto.tenantId = caller.tenantId ?? undefined;
    }

    const firebaseUser = await admin.auth().createUser({
      email: dto.email,
      password: dto.password,
      displayName: [dto.firstName, dto.lastName].filter(Boolean).join(' '),
    });

    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: dto.role,
      tenantId: dto.tenantId ?? null,
      permissions: DEFAULT_PERMISSIONS[dto.role] ?? [],
    });

    return this.userRepo.create({
      firebaseUid: firebaseUser.uid,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      tenantId: dto.tenantId ?? null,
      isActive: true,
    });
  }
}
