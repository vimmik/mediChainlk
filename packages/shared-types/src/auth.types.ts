export type UserRole = 'system_admin' | 'pharmacy_admin' | 'pharmacy_staff' | 'customer';

export interface FirebaseCustomClaims {
  tenantId: string | null;
  role: UserRole;
  permissions: string[];
}
