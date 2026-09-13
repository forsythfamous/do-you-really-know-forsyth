import { AdminUser } from '../../types';

export interface AdminCredentials {
  email?: string;
  password?: string;
}

/**
 * Clean AdminAuthProvider interface decoupling the dashboard UI
 * from specific authentication providers (Firebase Auth, Dev Preview, etc.).
 */
export interface AdminAuthProvider {
  /**
   * Attempts sign-in with the provided credentials or dev authorization.
   */
  signIn(credentials?: AdminCredentials): Promise<AdminUser>;

  /**
   * Signs out the current admin user and cleans up active sessions.
   */
  signOut(): Promise<void>;

  /**
   * Returns the currently active AdminUser or null if not authenticated.
   */
  getCurrentAdmin(): AdminUser | null;

  /**
   * Subscribes to authentication state changes.
   * Returns an unsubscribe callback.
   */
  subscribeToAuthState(callback: (user: AdminUser | null) => void): () => void;

  /**
   * Checks if an admin session is currently authenticated.
   */
  isAuthenticated(): boolean;

  /**
   * Checks if the authenticated user possesses verified authorized admin privileges.
   */
  isAuthorizedAdmin(): boolean;

  /**
   * Indicates whether this adapter is a development/preview adapter.
   */
  isDevMode: boolean;
}
