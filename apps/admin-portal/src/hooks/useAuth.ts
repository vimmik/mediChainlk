'use client';

import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect } from 'react';

export function useAuth() {
  const { user, loading, role, permissions, setUser, setLoading, setClaims, reset } =
    useAuthStore();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult(/* forceRefresh */ true);
          const claims = tokenResult.claims as {
            role?: string;
            tenantId?: string;
            permissions?: string[];
          };

          type SessionPayload = {
            authenticated?: boolean;
            role?: string;
            tenantId?: string | null;
            permissions?: string[];
          };

          let session: SessionPayload | null = null;
          const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
            credentials: 'include',
            cache: 'no-store',
          }).catch(() => null);

          if (sessionRes?.ok) {
            session = (await sessionRes.json()) as SessionPayload;
          }

          // If Redis session is missing/expired but Firebase auth still exists,
          // re-create the server session cookie transparently.
          if (!session?.authenticated) {
            const idToken = await firebaseUser.getIdToken(true);
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            }).catch(() => null);

            const retrySessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
              credentials: 'include',
              cache: 'no-store',
            }).catch(() => null);
            if (retrySessionRes?.ok) {
              session = (await retrySessionRes.json()) as SessionPayload;
            }
          }

          // Session cookie is now HttpOnly and set by the backend /auth/session
          // endpoint during login. We no longer write it from JS — doing so would
          // downgrade HttpOnly and re-expose the token to XSS.

          setClaims(
            session?.role ?? claims.role ?? '',
            session?.tenantId ?? claims.tenantId ?? null,
            session?.permissions ?? claims.permissions ?? [],
          );
          setUser(firebaseUser);
        } catch {
          // Token fetch failed — sign out cleanly
          await signOut(auth);
          reset();
        }
      } else {
        // Notify backend to destroy the Redis session + clear the HttpOnly cookie.
        // Fire-and-forget — `keepalive` allows the request to complete even if the
        // user navigates away immediately after.
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
            method: 'DELETE',
            credentials: 'include',
            keepalive: true,
          });
        } catch {
          // Backend unreachable — cookie will still expire naturally
        }
        reset();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setLoading, setClaims, reset]);

  return { user, loading, role, permissions };
}

// Convenience hooks
export function useRole() {
  return useAuthStore((s) => s.role);
}

export function usePermissions() {
  return useAuthStore((s) => s.permissions);
}

export function useHasPermission(code: string) {
  return useAuthStore((s) => s.permissions.includes(code));
}
