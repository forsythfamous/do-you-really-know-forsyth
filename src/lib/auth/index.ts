import { isFirebaseConfigured } from '../firebase';
import { AdminAuthProvider } from './adminAuthInterface';
import { DevAdminAuthAdapter } from './devAdminAuthAdapter';
import { FirebaseAdminAuthAdapter } from './firebaseAdminAuthAdapter';

export * from './adminAuthInterface';
export * from './devAdminAuthAdapter';
export * from './firebaseAdminAuthAdapter';

let providerInstance: AdminAuthProvider | null = null;

export function getAdminAuthProvider(): AdminAuthProvider {
  if (!providerInstance) {
    if (isFirebaseConfigured()) {
      providerInstance = new FirebaseAdminAuthAdapter();
    } else {
      const isDevEnv =
        (typeof import.meta !== 'undefined' &&
          (import.meta.env?.DEV === true ||
            import.meta.env?.MODE === 'development' ||
            import.meta.env?.VITE_ENABLE_DEV_ADMIN === 'true')) ||
        (typeof process !== 'undefined' &&
          (process.env?.NODE_ENV !== 'production' ||
            process.env?.VITE_ENABLE_DEV_ADMIN === 'true'));

      if (isDevEnv) {
        providerInstance = new DevAdminAuthAdapter();
      } else {
        // Never allow DevAdminAuthAdapter in production when Firebase is not configured
        providerInstance = new FirebaseAdminAuthAdapter();
      }
    }
  }
  return providerInstance;
}

export const defaultAdminAuthProvider = getAdminAuthProvider();
