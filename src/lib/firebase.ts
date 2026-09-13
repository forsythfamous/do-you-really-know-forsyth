import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  adminUid?: string;
}

/**
 * Reads Firebase configuration strictly from approved environment variables:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 * - VITE_ADMIN_UID
 *
 * Does not invent fallback or fake credentials.
 */
export function getFirebaseEnvConfig(): FirebaseClientConfig | null {
  // Support both Vite browser environment and Node/test environment
  const env: Record<string, string | undefined> =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as unknown as Record<string, string | undefined>)
      : typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>)
      : {};

  const apiKey = env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = env.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = env.VITE_FIREBASE_APP_ID?.trim();
  const adminUid = env.VITE_ADMIN_UID?.trim();

  // If essential configuration fields are missing, Firebase is not configured
  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId,
    appId,
    adminUid: adminUid || undefined,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseEnvConfig() !== null;
}

/**
 * Detects whether the runtime is an automated test, test script, or test runner.
 * Used to enforce test isolation and prevent test fixtures from accessing live Firestore.
 */
export function isTestEnvironment(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.npm_lifecycle_event === 'test' ||
      process.env.QUIZ_TEST_MODE === 'true' ||
      Boolean(process.env.VITEST) ||
      Boolean(process.env.JEST_WORKER_ID)
    ) {
      return true;
    }
    if (typeof window === 'undefined' && Array.isArray(process.argv)) {
      if (process.argv.some((arg) => /test|verify_/i.test(arg))) {
        return true;
      }
    }
  }
  return false;
}

export function getConfiguredAdminUid(): string | null {
  const config = getFirebaseEnvConfig();
  return config?.adminUid || null;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseEnvConfig();
  if (!config) return null;

  if (!appInstance) {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    }
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore | null {
  // Requirement 4: Production Firestore activation must not occur inside npm test
  if (isTestEnvironment()) {
    console.warn('[Firebase] Production Firestore activation blocked: automated test environment detected.');
    return null;
  }

  const app = getFirebaseApp();
  if (!app) return null;
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

let anonymousAuthPromise: Promise<string | null> | null = null;

/**
 * Automatically ensures an anonymous authentication session for quiz participants.
 * Does not show a login screen to the participant.
 * Reuses an existing session if already signed in.
 */
export async function ensureAnonymousParticipant(): Promise<string | null> {
  // Requirement 1 & 4: In test environments, never call live Firebase Auth
  if (isTestEnvironment()) {
    return 'mock-test-participant-uid';
  }

  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
  } catch {
    // Continue to check currentUser or sign in
  }

  if (auth.currentUser) {
    return auth.currentUser.uid;
  }

  if (anonymousAuthPromise) {
    return anonymousAuthPromise;
  }

  anonymousAuthPromise = (async () => {
    try {
      if (auth.currentUser) return auth.currentUser.uid;
      const cred = await signInAnonymously(auth);
      return cred.user.uid;
    } catch (err) {
      console.warn('[FirebaseAuth] Anonymous participant auth failed:', (err as Error).message);
      throw err;
    } finally {
      anonymousAuthPromise = null;
    }
  })();

  return anonymousAuthPromise;
}
