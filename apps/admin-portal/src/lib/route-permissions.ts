/**
 * Canonical route → required-permission map for the admin/pharmacy portal.
 *
 * Used by:
 *   - middleware.ts — gates navigations at the edge
 *   - Sidebar.tsx (indirectly) — determines which nav items render
 *
 * Keeping this in one place means we cannot forget to protect a new page:
 * the middleware will reject anything not in PUBLIC_PATHS and not in this map.
 *
 * Match order matters: more specific prefixes must appear before their parents
 * (e.g. /tenants/[id]/branches before /tenants).
 */

export interface RouteRule {
  /** URL path prefix this rule governs (matched with startsWith). */
  prefix: string;
  /**
   * Permission code required to access. `null` means "any authenticated user".
   * If the user's role is `system_admin`, the permission check is bypassed
   * (system admins have implicit access to admin-portal routes).
   */
  permission: string | null;
  /**
   * Optional: restrict this route to specific roles. If omitted, any
   * authenticated user with the permission may enter.
   */
  roles?: string[];
}

/**
 * Public paths — no auth required. Anything not matching these and not
 * matching a protected rule is rejected by the middleware.
 */
export const PUBLIC_PATHS = ['/login', '/forgot-password', '/unauthorized'];

/**
 * Protected route rules. Ordered most-specific first.
 */
export const PROTECTED_ROUTES: RouteRule[] = [
  // System-admin only areas
  { prefix: '/tenants',      permission: 'PHARMACY_MANAGE', roles: ['system_admin'] },
  { prefix: '/permissions',  permission: 'USER_MANAGE',     roles: ['system_admin'] },
  { prefix: '/monitoring',   permission: null,              roles: ['system_admin'] },

  // Shared — permission-gated
  { prefix: '/users',        permission: 'USER_MANAGE' },
  { prefix: '/inventory',    permission: 'INVENTORY_VIEW' },
  { prefix: '/orders',       permission: 'ORDER_VIEW' },
  { prefix: '/reports',      permission: 'REPORTS_VIEW' },

  // Dashboard — any authenticated admin/pharmacy user
  { prefix: '/dashboard',    permission: 'DASHBOARD_VIEW' },
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function findRouteRule(pathname: string): RouteRule | null {
  return (
    PROTECTED_ROUTES.find(
      (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'),
    ) ?? null
  );
}

/**
 * Decide if a given session may access a path.
 * Returns an object describing the outcome so callers can distinguish
 * "not authenticated" from "authenticated but forbidden".
 */
export type AccessDecision =
  | { kind: 'allow' }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden'; requiredPermission: string | null; rule: RouteRule };

export function decideAccess(
  pathname: string,
  session: { authenticated: boolean; role?: string; permissions?: string[] } | null,
): AccessDecision {
  if (isPublicPath(pathname)) return { kind: 'allow' };

  if (!session?.authenticated) return { kind: 'unauthenticated' };

  const rule = findRouteRule(pathname);
  // Unknown protected route: default-deny. Add it to PROTECTED_ROUTES.
  if (!rule) {
    return {
      kind: 'forbidden',
      requiredPermission: null,
      rule: { prefix: pathname, permission: null },
    };
  }

  // Role gate
  if (rule.roles && rule.roles.length > 0) {
    if (!session.role || !rule.roles.includes(session.role)) {
      return { kind: 'forbidden', requiredPermission: rule.permission, rule };
    }
  }

  // system_admin bypasses permission checks on admin-portal routes
  if (session.role === 'system_admin') return { kind: 'allow' };

  // Permission gate
  if (rule.permission) {
    if (!session.permissions?.includes(rule.permission)) {
      return { kind: 'forbidden', requiredPermission: rule.permission, rule };
    }
  }

  return { kind: 'allow' };
}
