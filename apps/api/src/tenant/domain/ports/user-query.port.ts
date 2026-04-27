export const USER_QUERY_PORT = 'USER_QUERY_PORT';

export interface IUserQueryPort {
  findById(userId: string): Promise<{ id: string; tenantId: string | null; role: string } | null>;
}
