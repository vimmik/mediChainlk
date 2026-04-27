# Implementation Plan — Admin Portal: Authentication & User Management

> **Scope:** `apps/admin-portal` (Next.js 15) + `apps/api` (NestJS 11) + `apps/api/prisma/schema.prisma`
> **Target role:** `system_admin` only
> **Date authored:** 2026-04-12
> **Status:** Pending implementation

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Free PostgreSQL Database Setup (Neon)](#2-free-postgresql-database-setup-neon)
3. [Phase 1 — Prisma Schema Extensions](#3-phase-1--prisma-schema-extensions)
4. [Phase 2 — NestJS API](#4-phase-2--nestjs-api)
5. [Phase 3 — Admin Portal: Auth Hardening](#5-phase-3--admin-portal-auth-hardening)
6. [Phase 4 — Admin Portal: Users Page](#6-phase-4--admin-portal-users-page)
7. [Phase 5 — Admin Portal: Permissions Page](#7-phase-5--admin-portal-permissions-page)
8. [Phase 6 — Security Hardening](#8-phase-6--security-hardening)
9. [File Change Map](#9-file-change-map)
10. [Implementation Order](#10-implementation-order)
11. [Testing Checklist](#11-testing-checklist)

---

## 1. Current State Audit

### What exists and works

| Area | File | State |
|------|------|-------|
| Login page | `(auth)/login/page.tsx` | Basic — no validation, no forgot-password, no role check |
| `useAuth` hook | `hooks/useAuth.ts` | Listens to `onAuthStateChanged` — does NOT extract Custom Claims |
| `authStore` | `store/authStore.ts` | Stores raw Firebase `User` — no `role`, `tenantId`, `permissions` |
| Dashboard layout | `(dashboard)/layout.tsx` | **No auth guard** — any unauthenticated user can access `/dashboard` |
| Users page | `(dashboard)/users/page.tsx` | Empty — just a heading |
| API axios client | `lib/api.ts` | Attaches Firebase ID token ✓ |
| Firebase init | `lib/firebase.ts` | Lazy SSR-safe init ✓ |
| API — `GET /users` | `user.controller.ts` | Returns all users for tenant — no filters, no pagination |
| API — `POST /users` | `user.controller.ts` | Creates user — no update/delete/deactivate |
| API — `GET /tenants` | `tenant.controller.ts` | Works, `system_admin` only ✓ |
| API — `RolesGuard` | `guards/roles.guard.ts` | Exists but NOT applied on user endpoints |
| Prisma `User` | `schema.prisma` | Missing: NIC, birthday, gender, address fields from ER diagram |
| `ScreenPermission` table | `schema.prisma` | **Does not exist** |
| Helmet / Throttler | `main.ts` | **Not configured** |

### What the ER diagram defines that is missing

From `docs/er_diagram.md`, the `User` entity includes:
- `NIC`, `Birthday`, `Gender`, `Height`, `Weight`
- `AddressLine1`, `AddressLine2`, `AddressLine3`, `District`, `PostalCode`
- `PharmacyID` (FK, only for pharmacist users)

And there are two new tables:
- `ScreenPermissions` — `PermissionID`, `PermissionCode`, `ScreenName`
- `UserTypePermissionMapping` — maps `UserTypeCode/ID` ↔ `PermissionCode/ID`

---

## 2. Free PostgreSQL Database Setup (Neon)

**Recommended service: [neon.tech](https://neon.tech)**

Chosen because:
- Truly free tier (no credit card required)
- PostgreSQL 16 — identical to target production (AWS RDS)
- Serverless with auto-suspend (no idle cost)
- Prisma-compatible connection string out of the box
- Supports pooled + direct connections (important for Prisma migrations)

### Steps

1. Go to [neon.tech](https://neon.tech) → Sign up (GitHub login recommended)
2. Click **"New Project"** → name it `medichainlk-dev` → region: `Asia Pacific (Singapore)` → **Create**
3. Copy the **pooled connection string** (looks like `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`)
4. Copy the **direct connection string** too (needed for migrations — starts with `postgresql://` but without `pgbouncer=true`)
5. Set in `apps/api/.env`:

```env
# Pooled — used by the running app
DATABASE_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Direct — used only by Prisma migrate
DIRECT_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=false"
```

6. Update `apps/api/prisma/schema.prisma` datasource block to use both URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

7. Run migrations:

```bash
npm run db:migrate
npm run db:generate
```

8. Open Prisma Studio to confirm tables are created:

```bash
npm run db:studio
```

---

## 3. Phase 1 — Prisma Schema Extensions

**File:** `apps/api/prisma/schema.prisma`

### 3.1 Extend `User` model

Add the fields defined in the ER diagram that are missing:

```prisma
model User {
  id            String    @id @default(cuid())
  firebaseUid   String    @unique
  email         String?
  phone         String?
  firstName     String?
  lastName      String?
  role          String                      // system_admin | pharmacy_staff | customer
  tenantId      String?
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  pharmacyId    String?                     // FK — only set when role = pharmacy_staff
  pharmacy      Pharmacy? @relation(fields: [pharmacyId], references: [id])
  isActive      Boolean   @default(true)

  // ── New fields from ER diagram ──────────────────────────────
  nic           String?   @unique           // National Identity Card
  birthday      DateTime?
  gender        String?                     // MALE | FEMALE | OTHER
  height        Float?                      // cm
  weight        Float?                      // kg
  addressLine1  String?
  addressLine2  String?
  addressLine3  String?
  district      String?
  postalCode    String?
  // ────────────────────────────────────────────────────────────

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orders        Order[]
  prescriptions Prescription[]
  diseases      DiseaseUserMapping[]
}
```

### 3.2 Add `ScreenPermission` model

```prisma
model ScreenPermission {
  id              String                   @id @default(cuid())
  permissionCode  String                   @unique
  screenName      String
  description     String?
  createdAt       DateTime                 @default(now())
  userTypeMappings UserTypePermission[]
}
```

### 3.3 Add `UserTypePermission` model

```prisma
model UserTypePermission {
  id           String           @id @default(cuid())
  userTypeCode String                               // system_admin | pharmacy_staff | customer
  permissionId String
  permission   ScreenPermission @relation(fields: [permissionId], references: [id])
  isEnabled    Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([userTypeCode, permissionId])
}
```

### 3.4 Add `AuditLog` model

Required for healthcare compliance. Tracks who changed what, when.

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  actorUid   String                        // Firebase UID of the user who performed the action
  actorRole  String
  tenantId   String?
  action     String                        // USER_CREATED | USER_DEACTIVATED | PERMISSION_CHANGED | etc.
  entityType String                        // User | Tenant | Permission
  entityId   String
  before     Json?                         // snapshot before change
  after      Json?                         // snapshot after change
  ipAddress  String?
  createdAt  DateTime @default(now())
}
```

### 3.5 Add `DiseaseUserMapping` model (from ER diagram)

```prisma
model DiseaseDetail {
  id          String               @id @default(cuid())
  diseaseCode String               @unique
  diseaseName String
  users       DiseaseUserMapping[]
}

model DiseaseUserMapping {
  id         String        @id @default(cuid())
  userId     String
  user       User          @relation(fields: [userId], references: [id])
  diseaseId  String
  disease    DiseaseDetail @relation(fields: [diseaseId], references: [id])
  createdAt  DateTime      @default(now())

  @@unique([userId, diseaseId])
}
```

### 3.6 Migration command

After editing the schema:

```bash
npm run db:migrate   # creates migration + applies it
npm run db:generate  # regenerates Prisma client
```

---

## 4. Phase 2 — NestJS API

### 4.1 Install new packages

```bash
npm install @nestjs/throttler helmet --workspace=apps/api
```

### 4.2 Update `main.ts` — add Helmet + Throttler

**File:** `apps/api/src/main.ts`

```typescript
import helmet from 'helmet';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// In bootstrap():
app.use(helmet());   // sets HSTS, X-Frame-Options, CSP, etc.
```

And in `AppModule` imports:
```typescript
ThrottlerModule.forRoot([{
  ttl: 60_000,   // 1 minute window
  limit: 100,    // global: max 100 requests per minute per IP
}]),
```

Apply tighter throttle on auth-adjacent routes (user invite/delete).

### 4.3 Extend `user` module

#### New endpoints

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| `GET` | `/users` | `system_admin` | List with filters: `role`, `tenantId`, `isActive`, `search` (name/email), `page`, `limit` |
| `GET` | `/users/:id` | `system_admin` | Full profile |
| `PUT` | `/users/:id` | `system_admin` | Update profile fields + role |
| `PATCH` | `/users/:id/deactivate` | `system_admin` | Soft-delete: set `isActive = false` |
| `PATCH` | `/users/:id/reactivate` | `system_admin` | Re-enable: set `isActive = true` |
| `DELETE` | `/users/:id` | `system_admin` | Hard delete: remove from Firebase Auth + DB |
| `POST` | `/users/invite` | `system_admin` | Create Firebase user → set Custom Claims → create DB record |

#### DTOs needed

**`UpdateUserDto`:**
```typescript
export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() tenantId?: string;
  @IsOptional() @IsString() pharmacyId?: string;
  @IsOptional() @IsString() nic?: string;
  @IsOptional() @IsDateString() birthday?: string;
  @IsOptional() @IsIn(['MALE','FEMALE','OTHER']) gender?: string;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() postalCode?: string;
}
```

**`InviteUserDto`:**
```typescript
export class InviteUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsIn(['system_admin','pharmacy_staff','customer']) role: string;
  @IsOptional() @IsString() tenantId?: string;
  @IsOptional() @IsString() pharmacyId?: string;
}
```

**`ListUsersQueryDto`:**
```typescript
export class ListUsersQueryDto {
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() tenantId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() search?: string;      // searches firstName, lastName, email
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
}
```

#### `UserService` additions

```typescript
// List with pagination + filters
async findAll(query: ListUsersQueryDto): Promise<{ data: User[]; total: number }> {
  const where = {
    ...(query.role && { role: query.role }),
    ...(query.tenantId && { tenantId: query.tenantId }),
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.search && {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
      take: query.limit ?? 20,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count({ where }),
  ]);

  return { data, total };
}

// Update
async update(id: string, dto: UpdateUserDto): Promise<User> { ... }

// Deactivate (soft delete)
async deactivate(id: string): Promise<User> {
  return this.prisma.user.update({ where: { id }, data: { isActive: false } });
}

// Reactivate
async reactivate(id: string): Promise<User> {
  return this.prisma.user.update({ where: { id }, data: { isActive: true } });
}

// Hard delete — removes from Firebase AND database
async hardDelete(id: string): Promise<void> {
  const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
  await admin.auth().deleteUser(user.firebaseUid);
  await this.prisma.user.delete({ where: { id } });
}

// Invite — creates Firebase user, sets custom claims, creates DB record
async invite(dto: InviteUserDto): Promise<User> {
  const firebaseUser = await admin.auth().createUser({
    email: dto.email,
    password: dto.password,
    displayName: `${dto.firstName} ${dto.lastName}`,
  });

  await admin.auth().setCustomUserClaims(firebaseUser.uid, {
    role: dto.role,
    tenantId: dto.tenantId ?? null,
    permissions: this.getDefaultPermissions(dto.role),
  });

  return this.prisma.user.create({
    data: {
      firebaseUid: firebaseUser.uid,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      tenantId: dto.tenantId,
      pharmacyId: dto.pharmacyId,
    },
  });
}
```

### 4.4 New `permissions` module

**File structure:**
```
apps/api/src/permissions/
  permissions.module.ts
  permissions.controller.ts
  permissions.service.ts
  dto/
    update-role-permissions.dto.ts
```

#### Endpoints

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| `GET` | `/permissions` | `system_admin` | List all screen permissions |
| `GET` | `/permissions/role/:role` | `system_admin` | Get all permissions for a role |
| `PUT` | `/permissions/role/:role` | `system_admin` | Enable/disable permissions for a role |

#### `PermissionsService`

```typescript
// Get permissions matrix for a role
async getByRole(role: string) {
  const allPerms = await this.prisma.screenPermission.findMany();
  const roleMappings = await this.prisma.userTypePermission.findMany({
    where: { userTypeCode: role },
    include: { permission: true },
  });

  return allPerms.map(p => ({
    ...p,
    isEnabled: roleMappings.find(m => m.permissionId === p.id)?.isEnabled ?? false,
  }));
}

// Upsert permissions for a role
async updateRolePermissions(role: string, updates: { permissionId: string; isEnabled: boolean }[]) {
  return Promise.all(
    updates.map(u =>
      this.prisma.userTypePermission.upsert({
        where: { userTypeCode_permissionId: { userTypeCode: role, permissionId: u.permissionId } },
        create: { userTypeCode: role, permissionId: u.permissionId, isEnabled: u.isEnabled },
        update: { isEnabled: u.isEnabled },
      })
    )
  );
}
```

### 4.5 Seed `ScreenPermission` records

Create `apps/api/prisma/seed.ts` to seed the initial permissions from the ER diagram:

```typescript
const PERMISSIONS = [
  { permissionCode: 'DASHBOARD_VIEW',      screenName: 'Dashboard' },
  { permissionCode: 'ANALYTICS_VIEW',      screenName: 'Analytics' },
  { permissionCode: 'PHARMACY_MANAGE',     screenName: 'Pharmacy Management' },
  { permissionCode: 'USER_MANAGE',         screenName: 'User Management' },
  { permissionCode: 'PRESCRIPTION_VIEW',   screenName: 'View Prescriptions' },
  { permissionCode: 'PRESCRIPTION_REVIEW', screenName: 'Review Prescriptions' },
  { permissionCode: 'INVENTORY_VIEW',      screenName: 'View Inventory' },
  { permissionCode: 'INVENTORY_MANAGE',    screenName: 'Manage Inventory' },
  { permissionCode: 'ORDER_VIEW',          screenName: 'View Orders' },
  { permissionCode: 'ORDER_MANAGE',        screenName: 'Manage Orders' },
  { permissionCode: 'BILLING_VIEW',        screenName: 'View Billing' },
  { permissionCode: 'BILLING_MANAGE',      screenName: 'Manage Billing' },
  { permissionCode: 'AI_PIPELINE_VIEW',    screenName: 'AI Pipeline' },
  { permissionCode: 'DELIVERY_MANAGE',     screenName: 'Manage Delivery' },
  { permissionCode: 'GRN_MANAGE',          screenName: 'GRN Management' },
  { permissionCode: 'MEDICINE_MANAGE',     screenName: 'Medicine Management' },
  { permissionCode: 'REPORTS_VIEW',        screenName: 'Reports' },
];
```

Run with: `npx ts-node apps/api/prisma/seed.ts`

### 4.6 `AuditLog` interceptor

Create `apps/api/src/common/interceptors/audit.interceptor.ts`.

Applied on all destructive user/permission endpoints. Writes a row to `AuditLog` with:
- `actorUid` — from `request.user.uid`
- `action` — derived from HTTP method + route
- `entityId` — from route param `:id`
- `before` / `after` — service fetches entity before and after mutation

---

## 5. Phase 3 — Admin Portal: Auth Hardening

### 5.1 Next.js Middleware (server-side auth gate)

**New file:** `apps/admin-portal/src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public paths through
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for Firebase session token in cookie
  // (set by client after login — see §5.3)
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

> **Note on session cookie:** After successful login, the client calls `POST /api/session` (Next.js API route) which sets an HttpOnly cookie. This is the only secure way to gate SSR pages. Alternatively, keep it simple with a cookie written by the client (`document.cookie`) — this is sufficient for SPA-style apps.

### 5.2 Upgrade `authStore`

**File:** `apps/admin-portal/src/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  // Custom Claims (from Firebase ID token result)
  role: string | null;
  tenantId: string | null;
  permissions: string[];
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setClaims: (role: string, tenantId: string | null, permissions: string[]) => void;
  reset: () => void;
}
```

### 5.3 Upgrade `useAuth` hook

**File:** `apps/admin-portal/src/hooks/useAuth.ts`

```typescript
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    // Extract Custom Claims
    const tokenResult = await firebaseUser.getIdTokenResult();
    const { role, tenantId, permissions } = tokenResult.claims as {
      role: string;
      tenantId: string | null;
      permissions: string[];
    };

    // Set session cookie for middleware
    document.cookie = `session=${await firebaseUser.getIdToken()}; path=/; SameSite=Strict`;

    setClaims(role, tenantId, permissions ?? []);
    setUser(firebaseUser);
  } else {
    // Clear session cookie on sign-out
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    reset();
  }
  setLoading(false);
});
```

Add convenience hooks:
```typescript
export function useRole() { return useAuthStore(s => s.role); }
export function usePermissions() { return useAuthStore(s => s.permissions); }
export function useHasPermission(code: string) {
  return useAuthStore(s => s.permissions.includes(code));
}
```

### 5.4 Harden login page

**File:** `apps/admin-portal/src/app/(auth)/login/page.tsx`

Changes:
1. Replace manual state with `react-hook-form` + Zod schema validation
2. Add show/hide password toggle
3. After login, check `tokenResult.claims.role === 'system_admin'` — if not, sign out and show "Access denied"
4. Add "Forgot password" link → `/forgot-password`
5. Replace generic error text with specific Firebase error codes

**Zod schema:**
```typescript
const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

**Error mapping:**
```typescript
const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found':      'No account found with this email.',
  'auth/wrong-password':      'Incorrect password.',
  'auth/too-many-requests':   'Too many attempts. Try again in a few minutes.',
  'auth/user-disabled':       'This account has been disabled.',
};
```

### 5.5 Forgot password page

**New file:** `apps/admin-portal/src/app/(auth)/forgot-password/page.tsx`

- Email input with Zod validation
- Calls `sendPasswordResetEmail(auth, email)` from Firebase
- Shows success confirmation with "Check your inbox"
- Does not reveal whether email exists (security: use same message regardless)

### 5.6 Role-filtered sidebar navigation

**File:** `apps/admin-portal/src/components/layout/Sidebar.tsx`

Read `role` and `permissions` from `useAuthStore`. Filter nav items so only authorized screens show. Add logout button at the bottom.

---

## 6. Phase 4 — Admin Portal: Users Page

### 6.1 Users list page

**File:** `apps/admin-portal/src/app/(dashboard)/users/page.tsx`

#### UI components on this page

```
┌─────────────────────────────────────────────────────────────────┐
│  Users                                        [+ Invite User]   │
│  Manage all platform users                                       │
├────────────────────┬────────────────┬────────────────────────────┤
│  Search: [______]  │ Role: [All ▼]  │ Status: [Active ▼]         │
├─────────────────────────────────────────────────────────────────┤
│ Name       │ Email        │ Role     │ Tenant   │ Status │ Actions │
│ ──────── ──────────────── ─────────── ────────── ──────── ─────── │
│ Kavishka   k@example.com  system_admin  —        Active   ⋮      │
│ Nimal S.   n@example.com  pharmacy_staff CCP     Active   ⋮      │
│ ...                                                               │
├─────────────────────────────────────────────────────────────────┤
│  Showing 1–20 of 47            [< Prev]  Page 1 of 3  [Next >]  │
└─────────────────────────────────────────────────────────────────┘
```

#### Column definitions (TanStack Table)

| Column | Cell render |
|--------|-------------|
| Name | `{firstName} {lastName}` |
| Email | plain text |
| Phone | plain text |
| Role | `<Badge>` with colour: purple=admin, blue=staff, green=customer |
| Tenant | tenant name or `—` if `system_admin` |
| Status | `<Badge variant="success">Active</Badge>` or `<Badge variant="secondary">Inactive</Badge>` |
| Actions | Dropdown: Edit, Deactivate/Reactivate, View Profile |

#### Row actions dropdown

```
Edit profile        → opens EditUserDrawer
Deactivate          → confirmation dialog → PATCH /users/:id/deactivate
Reactivate          → PATCH /users/:id/reactivate  (only shown if inactive)
Delete user         → confirmation dialog (danger) → DELETE /users/:id
```

### 6.2 `useUsers` hook

**New file:** `apps/admin-portal/src/hooks/useUsers.ts`

```typescript
export function useUsers(params: ListUsersQuery) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get('/users', { params }).then(r => r.data),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteUserDto) => api.post('/users/invite', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() { ... }
export function useDeactivateUser() { ... }
export function useReactivateUser() { ... }
export function useDeleteUser() { ... }
```

### 6.3 Invite User modal

**New file:** `apps/admin-portal/src/components/users/InviteUserModal.tsx`

```
┌─────────────────────────────┐
│  Invite New User         ✕  │
├─────────────────────────────┤
│  First name   [__________]  │
│  Last name    [__________]  │
│  Email        [__________]  │
│  Password     [________👁]  │
│  Role         [Select ▼  ]  │
│  Pharmacy     [Select ▼  ]  │  ← shown only when role = pharmacy_staff
├─────────────────────────────┤
│           [Cancel] [Invite] │
└─────────────────────────────┘
```

- Form validation with react-hook-form + Zod
- Pharmacy dropdown populated from `useTenants()` (existing hook)
- On success: closes modal, shows toast, invalidates users query

### 6.4 Edit User drawer

**New file:** `apps/admin-portal/src/components/users/EditUserDrawer.tsx`

Slides in from the right. Sections:

**Personal Info:**
- First name, Last name, Phone
- NIC, Birthday, Gender
- Height, Weight (optional — for pharmacy records)

**Address:**
- Address Line 1, 2, 3
- District dropdown (Sri Lanka districts list)
- Postal Code

**Account Settings:**
- Role selector
- Tenant selector (if pharmacist)
- Active/Inactive toggle

**Danger Zone:**
- "Deactivate Account" (with confirmation)
- "Delete Account" (with double confirmation — type user email)

### 6.5 User detail page

**New file:** `apps/admin-portal/src/app/(dashboard)/users/[id]/page.tsx`

Read-only profile view at `/users/{id}`. Same data as the drawer but presented as a full page. Used when navigating from other parts of the system (e.g., audit log entries).

---

## 7. Phase 5 — Admin Portal: Permissions Page

### 7.1 Route

**New file:** `apps/admin-portal/src/app/(dashboard)/permissions/page.tsx`

### 7.2 UI — Permission Matrix

```
┌──────────────────────────────────────────────────────────┐
│  Permissions                            [Save Changes]   │
│  Control which screens each role can access              │
├──────────────────────────┬───────────┬────────┬──────────┤
│  Screen                  │ Sys Admin │  Staff │ Customer │
├──────────────────────────┼───────────┼────────┼──────────┤
│  Dashboard               │    ✓      │   ✓   │    ✓     │
│  Analytics               │    ✓      │   ✓   │          │
│  Pharmacy Management     │    ✓      │        │          │
│  User Management         │    ✓      │        │          │
│  View Prescriptions      │    ✓      │   ✓   │          │
│  Review Prescriptions    │    ✓      │   ✓   │          │
│  View Inventory          │    ✓      │   ✓   │          │
│  Manage Inventory        │    ✓      │   ✓   │          │
│  View Orders             │    ✓      │   ✓   │   ✓      │
│  ...                     │   ...     │  ...  │   ...    │
└──────────────────────────┴───────────┴────────┴──────────┘
```

- Checkbox per cell
- "Save Changes" button is disabled until at least one change is made
- Saving calls `PUT /permissions/role/system_admin`, `PUT /permissions/role/pharmacy_staff`, and `PUT /permissions/role/customer` in parallel
- Shows unsaved changes warning if user tries to navigate away

### 7.3 `usePermissions` hook

**New file:** `apps/admin-portal/src/hooks/usePermissions.ts`

```typescript
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get('/permissions').then(r => r.data),
  });
}

export function useRolePermissions(role: string) {
  return useQuery({
    queryKey: ['permissions', role],
    queryFn: () => api.get(`/permissions/role/${role}`).then(r => r.data),
    enabled: !!role,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, updates }: { role: string; updates: PermissionUpdate[] }) =>
      api.put(`/permissions/role/${role}`, { updates }).then(r => r.data),
    onSuccess: (_, { role }) => qc.invalidateQueries({ queryKey: ['permissions', role] }),
  });
}
```

---

## 8. Phase 6 — Security Hardening

### 8.1 API layer

| Measure | Implementation | File |
|---------|---------------|------|
| Helmet headers | `app.use(helmet())` — sets HSTS, X-Frame-Options, X-Content-Type-Options, CSP | `apps/api/src/main.ts` |
| Rate limiting (global) | `ThrottlerModule` — 100 req/min per IP | `apps/api/src/app.module.ts` |
| Rate limiting (user write ops) | `@Throttle({ short: { ttl: 60_000, limit: 10 } })` on invite/delete | `user.controller.ts` |
| DTO whitelist | `whitelist: true, forbidNonWhitelisted: true` on `ValidationPipe` (already set) | `apps/api/src/main.ts` |
| Role enforcement | `@UseGuards(FirebaseAuthGuard, RolesGuard) @Roles('system_admin')` on all user/permission endpoints | `user.controller.ts`, `permissions.controller.ts` |
| Tenant isolation | All user queries scoped by `tenantId` from Custom Claims — `system_admin` is cross-tenant | `user.service.ts` |
| Audit trail | `AuditLog` interceptor on POST/PUT/PATCH/DELETE `/users`, `/permissions` | `audit.interceptor.ts` |
| Hard delete validation | Prevent deleting the last `system_admin` | `user.service.ts` |

### 8.2 Frontend layer

| Measure | Implementation | File |
|---------|---------------|------|
| SSR auth gate | Next.js middleware redirects unauthenticated requests before page render | `middleware.ts` |
| Role gate on login | After sign-in, verify `tokenResult.claims.role === 'system_admin'` | `login/page.tsx` |
| Permission-gated nav | Sidebar items filtered by `permissions[]` from `authStore` | `Sidebar.tsx` |
| Auto token refresh | Firebase SDK refreshes ID token every hour automatically — no action needed | — |
| Confirmation dialogs | Deactivate and Delete require confirmation modal with user email re-entry for delete | `EditUserDrawer.tsx` |
| Toast notifications | React Hot Toast / shadcn Toast on all mutation success/error states | All mutation hooks |

### 8.3 Database layer

| Measure | Notes |
|---------|-------|
| Tenant isolation | Every query includes `where: { tenantId }` — cross-tenant reads impossible |
| Soft deletes | `isActive = false` rather than hard delete by default — preserves audit trail |
| Unique constraints | `nic @unique`, `firebaseUid @unique`, `email` uniqueness enforced at DB level |
| Audit log | Non-deletable append-only table — records every change to users and permissions |

---

## 9. File Change Map

### New files

```
apps/api/src/
  permissions/
    permissions.module.ts
    permissions.controller.ts
    permissions.service.ts
    dto/
      update-role-permissions.dto.ts
  common/
    interceptors/
      audit.interceptor.ts
  prisma/
    seed.ts                                    ← seeds ScreenPermission records

apps/admin-portal/src/
  middleware.ts                                ← Next.js SSR auth gate
  app/
    (auth)/
      forgot-password/
        page.tsx
    (dashboard)/
      users/
        [id]/
          page.tsx                             ← User detail view
      permissions/
        page.tsx                               ← Permission matrix
  components/
    users/
      InviteUserModal.tsx
      UserTable.tsx
      EditUserDrawer.tsx
  hooks/
    useUsers.ts
    usePermissions.ts
```

### Modified files

```
apps/api/
  prisma/schema.prisma                         ← User fields, ScreenPermission, UserTypePermission, AuditLog
  src/main.ts                                  ← Helmet, Throttler
  src/app.module.ts                            ← ThrottlerModule import
  src/user/user.controller.ts                  ← New endpoints + RolesGuard
  src/user/user.service.ts                     ← findAll with filters, update, deactivate, reactivate, hardDelete, invite

apps/admin-portal/src/
  store/authStore.ts                           ← role, tenantId, permissions, reset()
  hooks/useAuth.ts                             ← extract Custom Claims, set session cookie
  app/(auth)/login/page.tsx                    ← react-hook-form, Zod, role check, forgot-password link
  app/(dashboard)/users/page.tsx               ← full implementation
  components/layout/Sidebar.tsx                ← permission-filtered nav, logout button
```

---

## 10. Implementation Order

Execute in this exact sequence to avoid broken states:

```
Step 1  →  Neon DB signup + get DATABASE_URL + DIRECT_URL
Step 2  →  Update schema.prisma (datasource directUrl + new models)
Step 3  →  npm run db:migrate && npm run db:generate
Step 4  →  Run seed.ts to populate ScreenPermission rows
Step 5  →  Install helmet + throttler packages in apps/api
Step 6  →  Update main.ts (Helmet + Throttler)
Step 7  →  Update user.service.ts (new methods)
Step 8  →  Update user.controller.ts (new endpoints + RolesGuard)
Step 9  →  Create permissions module (module, controller, service, dto)
Step 10 →  Create audit.interceptor.ts
Step 11 →  Test all API changes with Swagger (http://localhost:3001/api/docs)
Step 12 →  Create apps/admin-portal/src/middleware.ts
Step 13 →  Update authStore.ts (claims fields)
Step 14 →  Update useAuth.ts (extract claims + session cookie)
Step 15 →  Update login/page.tsx (RHF + Zod + role check)
Step 16 →  Create forgot-password/page.tsx
Step 17 →  Create hooks/useUsers.ts + hooks/usePermissions.ts
Step 18 →  Create InviteUserModal.tsx + EditUserDrawer.tsx
Step 19 →  Implement users/page.tsx (full table + filters + actions)
Step 20 →  Create users/[id]/page.tsx
Step 21 →  Create permissions/page.tsx (matrix)
Step 22 →  Update Sidebar.tsx (permission-gated nav + logout)
Step 23 →  End-to-end smoke test (login → users → invite → edit → permissions)
```

---

## 11. Testing Checklist

### Authentication

- [ ] Unauthenticated visit to `/dashboard` redirects to `/login?redirect=/dashboard`
- [ ] Login with valid `system_admin` credentials succeeds and redirects to `/dashboard`
- [ ] Login with `pharmacy_staff` credentials shows "Access denied" and signs out
- [ ] Login with wrong password shows correct error message
- [ ] "Forgot password" sends reset email (check Firebase Console → Authentication → Emails)
- [ ] After sign-out, pressing back does not reveal dashboard

### Users — API

- [ ] `GET /users` returns paginated list (test `?page=1&limit=5`)
- [ ] `GET /users?role=pharmacy_staff` filters correctly
- [ ] `GET /users?search=nimal` finds by first/last name
- [ ] `GET /users/:id` returns full profile including new fields
- [ ] `PUT /users/:id` updates profile and reflects in DB
- [ ] `PATCH /users/:id/deactivate` sets `isActive = false`
- [ ] `PATCH /users/:id/reactivate` sets `isActive = true`
- [ ] `POST /users/invite` creates Firebase user + sets Custom Claims + creates DB record
- [ ] `DELETE /users/:id` removes from Firebase Auth AND database
- [ ] All endpoints return `403` when called without `system_admin` role
- [ ] All endpoints return `401` without Authorization header

### Users — Frontend

- [ ] Users table loads with all columns
- [ ] Search input filters results (debounced, not on every keystroke)
- [ ] Role filter dropdown works
- [ ] Status filter works
- [ ] Pagination next/prev works
- [ ] "Invite User" modal opens, validates, submits, closes on success
- [ ] Edit drawer opens pre-filled, saves changes, closes on success
- [ ] Deactivate shows confirmation dialog, calls API on confirm
- [ ] Delete shows danger confirmation (requires typing email), calls API on confirm
- [ ] Reactivate button appears for inactive users

### Permissions

- [ ] Permission matrix loads correct initial state from DB
- [ ] Toggling a checkbox marks the page as "unsaved"
- [ ] "Save Changes" button is disabled when no changes made
- [ ] Saving calls API for all 3 roles
- [ ] Navigating away with unsaved changes shows a warning

### Security

- [ ] `OPTIONS` preflight allowed from `localhost:3002` only (CORS)
- [ ] Response headers include `X-Frame-Options: DENY` (Helmet)
- [ ] More than 100 API requests per minute from same IP returns `429`
- [ ] `PUT /users/:id` with extra unknown fields returns `400 Bad Request` (whitelist validation)
- [ ] AuditLog table gets new rows on user invite, deactivate, delete, permission change

---

*This plan covers every layer from database to UI. No steps should be skipped — each builds on the previous.*
