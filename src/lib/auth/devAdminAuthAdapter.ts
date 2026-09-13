import { AdminUser } from '../../types';
import { AdminAuthProvider, AdminCredentials } from './adminAuthInterface';

const DEV_ADMIN_SESSION_KEY = 'dyrkf_dev_admin_session_v1';

/**
 * DEVELOPMENT-ONLY Admin Access Adapter.
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * - This adapter is strictly for local preview/development environments.
 * - It is NEVER to be used or considered as production security.
 * - It contains NO real credentials.
 * - It is disabled by default in production builds.
 * - It displays a visible "Local Preview Mode" watermark/banner across admin views.
 */
export class DevAdminAuthAdapter implements AdminAuthProvider {
  public readonly isDevMode = true;
  private currentUser: AdminUser | null = null;
  private listeners: Set<(user: AdminUser | null) => void> = new Set();
  private isEnabled: boolean = false;

  constructor() {
    // Enabled ONLY in development mode or when explicitly enabled via env flag
    const isDevEnv =
      (typeof import.meta !== 'undefined' &&
        (import.meta.env?.DEV === true ||
          import.meta.env?.MODE === 'development' ||
          import.meta.env?.VITE_ENABLE_DEV_ADMIN === 'true')) ||
      (typeof process !== 'undefined' &&
        (process.env?.NODE_ENV !== 'production' ||
          process.env?.VITE_ENABLE_DEV_ADMIN === 'true'));

    this.isEnabled = Boolean(isDevEnv);

    if (this.isEnabled && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const saved = window.sessionStorage.getItem(DEV_ADMIN_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.uid && parsed.isAuthorizedAdmin) {
            this.currentUser = parsed;
          }
        }
      } catch (err) {
        console.warn('[DevAdminAuthAdapter] Failed to restore session:', err);
      }
    }
  }

  async signIn(
    credentials?: AdminCredentials | string,
    passwordParam?: string,
  ): Promise<AdminUser> {
    if (!this.isEnabled) {
      throw new Error(
        'Development Admin Adapter is disabled in this environment. Production Firebase Authentication is required.',
      );
    }

    let email = '';
    let password = '';
    if (typeof credentials === 'string') {
      email = credentials.trim();
      password = passwordParam || '';
    } else if (credentials) {
      email = credentials.email?.trim() || '';
      password = credentials.password || '';
    }

    if (credentials) {
      if (!email || !email.includes('@') || password.length < 6) {
        throw new Error('Invalid email or password for admin sign in.');
      }
    }

    // In dev mode, validate non-empty request or demo login
    const resolvedEmail = email || 'dev-admin@forsyth-local.preview';
    const devUser: AdminUser = {
      uid: 'dev-preview-admin-001',
      email: resolvedEmail,
      displayName: 'Forsyth (Preview Admin)',
      isAuthorizedAdmin: true,
      isDevMode: true,
    };

    this.currentUser = devUser;

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(DEV_ADMIN_SESSION_KEY, JSON.stringify(devUser));
      } catch (err) {
        console.warn('[DevAdminAuthAdapter] Could not persist dev session:', err);
      }
    }

    this.notifyListeners();
    return devUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(DEV_ADMIN_SESSION_KEY);
      } catch {
        // ignore
      }
    }
    this.notifyListeners();
  }

  getCurrentAdmin(): AdminUser | null {
    return this.currentUser;
  }

  subscribeToAuthState(callback: (user: AdminUser | null) => void): () => void {
    this.listeners.add(callback);
    // Initial call
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
        console.warn('[DevAdminAuthAdapter] Listener error:', err);
      }
    });
  }
}
