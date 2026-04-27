import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BRANCH_REPOSITORY, type IBranchRepository } from '../../domain/repositories/branch.repository';
import { USER_QUERY_PORT, type IUserQueryPort } from '../../domain/ports/user-query.port';
import type { TenantCallerContext } from '../../domain/tenant-access';
import { assertTenantAccess } from '../../domain/tenant-access';
import type { AssignBranchUserDto } from '../../dto/assign-branch-user.dto';

@Injectable()
export class StaffAssignmentUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branchRepo: IBranchRepository,
    @Inject(USER_QUERY_PORT) private readonly userQuery: IUserQueryPort,
  ) {}

  private async assertBranchExists(branchId: string, tenantId: string) {
    const branch = await this.branchRepo.findById(branchId, tenantId);
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async assign(
    tenantId: string,
    branchId: string,
    dto: AssignBranchUserDto,
    actorFirebaseUid: string,
    caller?: TenantCallerContext,
  ) {
    if (caller) assertTenantAccess(caller, tenantId);
    await this.assertBranchExists(branchId, tenantId);

    const user = await this.userQuery.findById(dto.userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.tenantId !== tenantId) throw new BadRequestException('User does not belong to this tenant');
    if (!['pharmacy_admin', 'pharmacy_staff'].includes(user.role)) {
      throw new BadRequestException('Only pharmacy_admin or pharmacy_staff can be assigned to branches');
    }

    return this.branchRepo.assignUser(branchId, dto, actorFirebaseUid);
  }

  async remove(tenantId: string, branchId: string, userId: string, caller?: TenantCallerContext) {
    if (caller) assertTenantAccess(caller, tenantId);
    await this.assertBranchExists(branchId, tenantId);
    return this.branchRepo.removeUser(branchId, userId);
  }
}
