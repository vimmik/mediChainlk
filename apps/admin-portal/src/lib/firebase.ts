import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserSessionPersistence, setPersistence } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Get or initialize Firebase app.
 * Safe to call during SSR/build (returns null if env vars not set).
 * Safe to call on client (initializes on first call).
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    // SSR/build environment - don't initialize
    return null;
  }

  if (app) {
    return app;
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check that required config is present
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase config is incomplete. Auth features will not work.');
    return null;
  }

  const existingApps = getApps();
  app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
  return app;
}

/**
 * Get Firebase Auth instance (lazy-initialized on first call).
 * Returns null on server/build or if config is incomplete.
 */
export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') {
    // SSR/build environment
    return null;
  }

  if (auth) {
    return auth;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  auth = getAuth(firebaseApp);

  // Use session-only persistence: token cleared when tab/browser closes.
  // Reduces exposure window compared to default indexedDB/localStorage persistence.
  // This is fire-and-forget — setPersistence returns a promise but the auth instance
  // is usable immediately with the default and switches atomically.
  setPersistence(auth, browserSessionPersistence).catch((err) => {
    console.warn('Failed to set Firebase session persistence:', err);
  });

  return auth;
}

// Legacy exports for backwards compatibility (use new functions instead)
export default getFirebaseApp();
