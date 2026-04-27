import axios, { AxiosError } from 'axios';
import { getFirebaseAuth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Hard cap: never hang indefinitely waiting for the API.
  // Mutations (POST/PUT/PATCH/DELETE) may legitimately take longer;
  // they can override this per-call if needed.
  timeout: 15_000,
  // Always send the HttpOnly session cookie so the server can authenticate
  // via Redis session rather than requiring a fresh Firebase ID token.
  withCredentials: true,
});

// ── Request interceptor — attach fresh Firebase ID token as Bearer ────────────
// The server accepts EITHER the HttpOnly cookie (preferred) OR a Bearer token.
// We send both so the API still works if the cookie is missing (e.g., mobile
// webview, cross-origin dev setup). The cookie always wins on the server side.
api.interceptors.request.use(async (config) => {
  try {
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      // getIdToken(false) returns a cached token unless it's within 5 min of expiry,
      // in which case Firebase refreshes it automatically. No extra network round-trip
      // on most requests.
      const token = await auth.currentUser.getIdToken(false);
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Token fetch failed — let the request proceed without a Bearer token.
    // The session cookie may still authenticate it.
  }
  return config;
});

// ── Response interceptor — handle auth errors and surface them cleanly ────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // Session expired or token revoked. Sign out and redirect to login so the
      // user doesn't stay on a page with stale state. Import dynamically to
      // avoid circular deps (firebase → api → firebase).
      try {
        const { getFirebaseAuth: getAuth } = await import('./firebase');
        const { signOut } = await import('firebase/auth');
        const auth = getAuth();
        if (auth) await signOut(auth);
      } catch {
        // Best-effort — even if signOut fails, redirect to login
      }
      if (typeof window !== 'undefined') {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${redirect}&reason=session_expired`;
      }
    }

    // For 429 Too Many Requests, attach a human-readable message
    if (status === 429) {
      const err = error as AxiosError & { userMessage?: string };
      err.userMessage = 'Too many requests — please wait a moment and try again.';
    }

    return Promise.reject(error);
  },
);

export default api;
