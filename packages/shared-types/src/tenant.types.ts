// ─── Tenant Management Types ─────────────────────────────────────────────────

export type BusinessType = 'sole_proprietorship' | 'partnership' | 'pvt_ltd' | 'plc';
export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';
export type ContactType = 'primary' | 'billing' | 'technical' | 'emergency';
export type DocumentType =
  | 'business_registration'
  | 'pharmacy_license'
  | 'nmra_certificate'
  | 'tax_certificate'
  | 'insurance'
  | 'other';

// ─── Tenant ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  legalName?: string | null;
  slug: string;
  registrationNo?: string | null;
  taxId?: string | null;
  businessType: BusinessType;
  logoUrl?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  isActive: boolean;
  isVerified: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiry?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { branches: number; users: number };
}

export interface TenantOwner {
  id: string;
  tenantId: string;
  fullName: string;
  nic?: string | null;
  phone?: string | null;
  email?: string | null;
  slmcRegNo?: string | null;
  qualification?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  district?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantContact {
  id: string;
  tenantId: string;
  contactType: ContactType;
  name: string;
  designation?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantDocument {
  id: string;
  tenantId: string;
  documentType: DocumentType;
  title: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Branch ──────────────────────────────────────────────────────────────────

export interface PharmacyBranch {
  id: string;
  tenantId: string;
  name: string;
  branchCode?: string | null;
  address: string;
  addressLine2?: string | null;
  city: string;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phone: string;
  email?: string | null;
  licenseNo: string;
  licenseExpiry?: string | null;
  pharmacistName?: string | null;
  pharmacistRegNo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingTime?: string | null;
  closingTime?: string | null;
  isOpen24h: boolean;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { staff: number };
}

export interface BranchStaffMember {
  id: string;
  userId: string;
  branchId: string;
  isPrimary: boolean;
  assignedAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role: string;
    isActive: boolean;
  };
}

// ─── Detail (includes relations) ─────────────────────────────────────────────

export interface TenantDetail extends Tenant {
  owner?: TenantOwner | null;
  contacts: TenantContact[];
  documents: TenantDocument[];
  branches: (PharmacyBranch & { _count: { staff: number } })[];
  users: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    isActive: boolean;
  }[];
}

// ─── Paginated response ──────────────────────────────────────────────────────

export interface PaginatedTenants {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Query params ────────────────────────────────────────────────────────────

export interface TenantQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  businessType?: BusinessType;
  subscriptionPlan?: SubscriptionPlan;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
