import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type CallerContext, type IUserRepository } from '../../domain/repositories/user.repository';
import type { ListUsersQueryDto } from '../../dto/list-users-query.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(query: ListUsersQueryDto, caller: CallerContext) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = {};

    if (caller.role === 'pharmacy_admin') {
      where.tenantId = caller.tenantId;
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

    const { data, total } = await this.userRepo.findAll(where, page, limit);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
