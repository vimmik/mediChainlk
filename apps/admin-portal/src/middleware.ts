import { NextRequest, NextResponse } from 'next/server';
import { decideAccess, isPublicPath } from './lib/route-permissions';

const SESSION_COOKIE = '__session';

interface SessionPayload {
  authenticated: boolean;
  role?: string;
  tenantId?: string | null;
  permissions?: string[];
  locked?: boolean;
}

type SessionLookup = SessionPayload | null | 'UNAVAILABLE';

/**
 * Edge middleware — single source of truth for route gating.
 *
 * For every HTML navigation we:
 *   1. Check for a session cookie.
 *   2. If present, verify it with the backend and fetch role + permissions.
 *   3. Decide access against the central route-permission map.
 *
 * Outcomes:
 *   - `/login` with a valid session   → redirect to /dashboard
 *   - protected route, no session     → redirect to /login?redirect=…
 *   - protected route, wrong perms    → redirect to /unauthorized
 *                                       + fire-and-forget report to backend
 *                                       (5 reports in 1h locks the account)
 *   - account locked by backend       → clear cookie, redirect to /login?reason=locked
 *
 * Non-HTML requests (fetch/XHR to internal assets) are allowed through as long
 * as a cookie is present — NestJS enforces its own guards on every API call,
 * so we don't double-check here and add latency.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isHtmlNavigation = request.headers.get('accept')?.includes('text/html') ?? false;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;

  // For non-HTML internal requests (RSC/flight/prefetch), never issue auth
  // redirects from middleware. Redirecting these can force a full navigation
  // to /login on refresh even when the user has an active client auth state.
  if (!isHtmlNavigation) {
    return NextResponse.next();
  }

  // HTML navigation path — do the full check
  const session = cookie ? await fetchSession(cookie) : null;

  // If backend session lookup is temporarily unavailable, or if a cookie is
  // present but Redis no longer has the session, avoid hard-logging out the
  // user on refresh. The client auth bootstrap can re-establish the session.
  if (cookie && (session === 'UNAVAILABLE' || session === null)) {
    return NextResponse.next();
  }

  // Locked account: clean up and kick to login with a reason
  if (session?.locked) {
    return redirectToLogin(request, pathname, 'locked', true);
  }

  // Authenticated user visiting a public auth page → send them home.
  // This covers http://localhost:3002/, /login, /forgot-password when the
  // user already has a session.
  if (session?.authenticated && (pathname === '/' || isPublicPath(pathname))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root path for unauthenticated users → login
  if (pathname === '/' && !session?.authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const decision = decideAccess(pathname, session ?? null);

  if (decision.kind === 'allow') {
    return NextResponse.next();
  }

  if (decision.kind === 'unauthenticated') {
    return redirectToLogin(request, pathname);
  }

  // forbidden — authenticated but no permission. Report to backend so the
  // lock counter advances, then send them to the unauthorized page.
  reportViolation(cookie, pathname, decision.requiredPermission);

  const unauthorizedUrl = new URL('/unauthorized', request.url);
  unauthorizedUrl.searchParams.set('path', pathname);
  if (decision.requiredPermission) {
    unauthorizedUrl.searchParams.set('need', decision.requiredPermission);
  }
  return NextResponse.redirect(unauthorizedUrl);
}

async function fetchSession(cookie: string): Promise<SessionLookup> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return 'UNAVAILABLE';

  try {
    const res = await fetch(`${apiUrl}/auth/session`, {
      headers: { cookie: `${SESSION_COOKIE}=${cookie}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      // 5xx means backend trouble, not necessarily an invalid session.
      if (res.status >= 500) return 'UNAVAILABLE';
      return null;
    }
    return (await res.json()) as SessionPayload;
  } catch {
    // Backend unreachable; do not force logout on a transient failure.
    return 'UNAVAILABLE';
  }
}

/**
 * Fire-and-forget unauthorized-access report. We intentionally do NOT await —
 * the user has already been decided against; the backend counts attempts
 * asynchronously and will lock the account on threshold breach.
 */
function reportViolation(
  cookie: string | undefined,
  pathname: string,
  requiredPermission: string | null,
): void {
  if (!cookie) return;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return;

  void fetch(`${apiUrl}/auth/session/violation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `${SESSION_COOKIE}=${cookie}`,
    },
    body: JSON.stringify({
      path: pathname.slice(0, 256),
      ...(requiredPermission ? { requiredPermission } : {}),
    }),
    // Edge runtime doesn't support keepalive, but the request still fires.
  }).catch(() => {
    /* swallow — telemetry only */
  });
}

function redirectToLogin(
  request: NextRequest,
  pathname: string,
  reason?: string,
  clearSessionCookie = false,
) {
  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/' && pathname !== '/login') {
    loginUrl.searchParams.set('redirect', pathname);
  }
  if (reason) loginUrl.searchParams.set('reason', reason);
  const res = NextResponse.redirect(loginUrl);
  if (clearSessionCookie) {
    res.cookies.delete(SESSION_COOKIE);
  }
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
