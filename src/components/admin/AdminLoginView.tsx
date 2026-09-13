import React, { useState } from 'react';
import { Shield, KeyRound, ArrowLeft, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { AdminAuthProvider } from '../../lib/auth/adminAuthInterface';
import { AdminUser } from '../../types';

interface AdminLoginViewProps {
  authProvider: AdminAuthProvider;
  onLoginSuccess: (user: AdminUser) => void;
  onReturnToApp: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  authProvider,
  onLoginSuccess,
  onReturnToApp,
}) => {
  const isDevMode = authProvider.isDevMode;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await authProvider.signIn({
        email: email.trim() || undefined,
        password: password || undefined,
      });
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevQuickSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await authProvider.signIn();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Preview mode sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Return button */}
      <div className="w-full max-w-md mb-6 flex justify-start">
        <button
          id="admin-login-return-btn"
          onClick={onReturnToApp}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Participant Quiz</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Shield Icon & Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
            Forsyth Admin Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Private management of quiz submissions, reflections & analytics
          </p>
        </div>

        {/* Local Preview Notice */}
        {isDevMode && (
          <div
            id="admin-login-dev-banner"
            className="mb-6 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">Local Preview Mode Active</p>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                Firebase production credentials are not configured. You may access the dashboard using the local preview adapter.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            id="admin-login-error"
            className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2"
          >
            <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Development Quick-Access Button */}
        {isDevMode ? (
          <div className="space-y-4">
            <button
              id="admin-dev-quick-login-btn"
              type="button"
              disabled={isSubmitting}
              onClick={handleDevQuickSignIn}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Entering Dashboard...' : 'Enter Preview Admin Dashboard'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-500">
                <span className="bg-slate-900 px-2">or specify preview identity</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="admin-email">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@preview.local"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="admin-pass">
                  Password
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Optional in preview mode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                id="admin-email-sign-in-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Sign In With Email</span>
              </button>
            </form>
          </div>
        ) : (
          /* Production Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="prod-admin-email">
                Forsyth's Administrator Email
              </label>
              <input
                id="prod-admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="forsyth@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="prod-admin-pass">
                Password
              </label>
              <input
                id="prod-admin-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              id="admin-prod-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Restricted administrative area. Real admin claims must be assigned via Firebase Admin SDK.
          </p>
        </div>
      </div>
    </div>
  );
};
