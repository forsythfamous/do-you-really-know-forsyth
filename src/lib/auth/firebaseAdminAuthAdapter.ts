import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { AdminUser } from '../../types';
import { AdminAuthProvider, AdminCredentials } from './adminAuthInterface';
import { getFirebaseAuth, getConfiguredAdminUid, isFirebaseConfigured } from '../firebase';

/**
 * Production Firebase Authentication Adapter for Forsyth's Admin Portal.
 *
 * AUTHENTICATION & AUTHORIZATION FLOW:
 * 1. Admin logs in with Email/Password via Firebase Authentication.
 * 2. Authenticated user's UID is compared against the configured VITE_ADMIN_UID
 *    (or verified custom claim { admin: true }).
 * 3. If the UID does not match, the session is immediately terminated and access is denied.
 * 4. Firestore security rules enforce authorization at the database level.
 */
export class FirebaseAdminAuthAdapter implements AdminAuthProvider {
  public readonly isDevMode = false;
  private currentUser: AdminUser | null = null;
  private listeners: Set<(user: AdminUser | null) => void> = new Set();
  private authUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    if (!isFirebaseConfigured()) return;

    try {
      const auth = getFirebaseAuth();
      if (!auth) return;

      this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user || user.isAnonymous) {
          if (this.currentUser) {
            this.currentUser = null;
            this.notifyListeners();
          }
          return;
        }

        const configuredAdminUid = getConfiguredAdminUid();
        let isAuthorized = false;

        if (configuredAdminUid && user.uid === configuredAdminUid) {
          isAuthorized = true;
        } else {
          try {
            const tokenResult = await user.getIdTokenResult();
            if (tokenResult.claims.admin === true) {
              isAuthorized = true;
            }
          } catch {
            isAuthorized = false;
          }
        }

        if (isAuthorized) {
          this.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Forsyth',
            isAuthorizedAdmin: true,
            isDevMode: false,
          };
        } else {
          this.currentUser = null;
        }
        this.notifyListeners();
      });
    } catch (err) {
      console.warn('[FirebaseAdminAuthAdapter] Failed to initialize auth listener:', (err as Error).message);
    }
  }

  async signIn(credentials?: AdminCredentials): Promise<AdminUser> {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase is not configured. Please supply the required VITE_FIREBASE_* and VITE_ADMIN_UID environment variables.',
      );
    }

    if (!credentials?.email || !credentials?.password) {
      throw new Error('Administrator email and password are required.');
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Authentication is unavailable.');
    }

    const cred = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const user = cred.user;

    const configuredAdminUid = getConfiguredAdminUid();
    let isAuthorized = false;

    if (configuredAdminUid && user.uid === configuredAdminUid) {
      isAuthorized = true;
    } else {
      try {
        const tokenResult = await user.getIdTokenResult(true);
        if (tokenResult.claims.admin === true) {
          isAuthorized = true;
        }
      } catch {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      await firebaseSignOut(auth);
      throw new Error('Unauthorized: This Firebase account UID does not match the configured VITE_ADMIN_UID.');
    }

    this.currentUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Forsyth',
      isAuthorizedAdmin: true,
      isDevMode: false,
    };

    this.notifyListeners();
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('[FirebaseAdminAuthAdapter] Sign out error:', (err as Error).message);
      }
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  getCurrentAdmin(): AdminUser | null {
    return this.currentUser;
  }

  subscribeToAuthState(callback: (user: AdminUser | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAuthorizedAdmin(): boolean {
    return this.currentUser !== null && this.currentUser.isAuthorizedAdmin === true;
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.currentUser);
      } catch (err) {
        console.warn('[FirebaseAdminAuthAdapter] Listener notification error:', err);
      }
    });
  }
}
