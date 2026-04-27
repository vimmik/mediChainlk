import type { PharmacyBranch, UserBranchAssignment } from '@prisma/client';
import type { AssignBranchUserDto } from '../../dto/assign-branch-user.dto';
import type { CreateBranchDto } from '../../dto/create-branch.dto';
import type { UpdateBranchDto } from '../../dto/update-branch.dto';

export const BRANCH_REPOSITORY = 'BRANCH_REPOSITORY';

export type BranchSummary = PharmacyBranch & { _count: { staff: number } };

export type StaffAssignmentEntry = UserBranchAssignment & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: string;
    isActive: boolean;
  };
};

export type BranchDetail = PharmacyBranch & { staff: StaffAssignmentEntry[] };

export interface IBranchRepository {
  findByTenant(tenantId: string): Promise<BranchSummary[]>;
  findById(branchId: string, tenantId: string): Promise<BranchDetail | null>;
  licenseNoTaken(licenseNo: string, excludeId?: string): Promise<boolean>;
  create(tenantId: string, data: CreateBranchDto): Promise<PharmacyBranch>;
  update(branchId: string, data: UpdateBranchDto): Promise<PharmacyBranch>;
  setStatus(branchId: string, isActive: boolean): Promise<PharmacyBranch>;
  // tenantId intentionally omitted — user validation belongs in the use case (Gap 2)
  assignUser(branchId: string, dto: AssignBranchUserDto, actorFirebaseUid: string): Promise<UserBranchAssignment>;
  removeUser(branchId: string, userId: string): Promise<void>;
}
