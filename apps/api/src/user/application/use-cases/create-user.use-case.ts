import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type IUserRepository } from '../../domain/repositories/user.repository';
import type { CreateUserDto } from '../../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(dto: CreateUserDto, tenantId: string) {
    return this.userRepo.create({ ...dto, tenantId });
  }
}
