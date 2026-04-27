import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, type CallerContext, type IUserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class GetUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(id: string, caller?: CallerContext) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (caller?.role === 'pharmacy_admin' && user.tenantId !== caller.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }
}
