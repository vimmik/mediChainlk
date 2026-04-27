import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { USER_REPOSITORY, type CallerContext, type IUserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class UserStatusUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async deactivate(id: string, caller?: CallerContext) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (caller?.role === 'pharmacy_admin' && user.tenantId !== caller.tenantId) {
      throw new ForbiddenException('Access denied');
    }
    if (user.firebaseUid === caller?.firebaseUid) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    await admin.auth().updateUser(user.firebaseUid, { disabled: true }).catch(() => null);
    return this.userRepo.setStatus(id, false);
  }

  async reactivate(id: string, caller?: CallerContext) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (caller?.role === 'pharmacy_admin' && user.tenantId !== caller.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    await admin.auth().updateUser(user.firebaseUid, { disabled: false }).catch(() => null);
    return this.userRepo.setStatus(id, true);
  }
}
