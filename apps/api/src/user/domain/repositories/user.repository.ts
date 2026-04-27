import type { DiseaseDetail, DiseaseUserMapping, Tenant, User, UserBranchAssignment } from '@prisma/client';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface CallerContext {
  role: string;
  tenantId?: string | null;
  firebaseUid: string;
}

export type UserRow = User & { tenant: { name: string } | null };

export type UserDetail = User & {
  tenant: Tenant | null;
  branchAssignments: Array<UserBranchAssignment & { branch: { id: string; name: string; city: string } }>;
  diseases: Array<DiseaseUserMapping & { disease: DiseaseDetail }>;
};

export interface IUserRepository {
  findAll(
    where: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<{ data: UserRow[]; total: number }>;
  findById(id: string): Promise<UserDetail | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  countSystemAdmins(): Promise<number>;
  create(data: Record<string, unknown>): Promise<User>;
  update(id: string, data: Record<string, unknown>): Promise<User>;
  setStatus(id: string, isActive: boolean): Promise<User | null>;
  delete(id: string): Promise<void>;
}
