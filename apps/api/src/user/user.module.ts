import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { InviteUserUseCase } from './application/use-cases/invite-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { ProvisionUserUseCase } from './application/use-cases/provision-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UserPermissionsUseCase } from './application/use-cases/user-permissions.use-case';
import { UserStatusUseCase } from './application/use-cases/user-status.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UserController } from './user.controller';

@Module({
  imports: [RedisModule],
  controllers: [UserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    ListUsersUseCase,
    GetUserUseCase,
    CreateUserUseCase,
    InviteUserUseCase,
    ProvisionUserUseCase,
    UpdateUserUseCase,
    UserPermissionsUseCase,
    UserStatusUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
