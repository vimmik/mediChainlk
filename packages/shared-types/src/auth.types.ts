export type UserRole = 'system_admin' | 'pharmacy_owner' | 'pharmacy_staff' | 'customer';

export interface FirebaseCustomClaims {
  tenantId: string;
  role: UserRole;
  permissions: Permission[];
}

export type Permission =
  | 'view_inventory'
  | 'manage_inventory'
  | 'confirm_prescription'
  | 'manage_orders'
  | 'view_reports'
  | 'manage_staff'
  | 'manage_pharmacies'
  | 'view_all_tenants';
