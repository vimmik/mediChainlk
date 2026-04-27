import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { USER_REPOSITORY, type CallerContext, type IUserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(id: string, caller?: CallerContext) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (caller?.role === 'pharmacy_admin' && user.tenantId !== caller.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'system_admin') {
      const adminCount = await this.userRepo.countSystemAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last system admin');
      }
    }

    await admin.auth().deleteUser(user.firebaseUid).catch(() => null);
    await this.userRepo.delete(id);
  }
}
