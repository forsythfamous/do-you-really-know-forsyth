import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  MessageSquareHeart,
  BarChart3,
  LogOut,
  ArrowLeft,
  AlertTriangle,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { AdminUser, AppRoute } from '../../types';
import { isCloudRepositoryActive } from '../../lib/repository';

interface AdminLayoutProps {
  currentRoute: AppRoute;
  currentAdmin: AdminUser | null;
  onNavigate: (route: AppRoute) => void;
  onSignOut: () => void;
  onReturnToApp: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentRoute,
  currentAdmin,
  onNavigate,
  onSignOut,
  onReturnToApp,
  children,
}) => {
  const isDevMode = currentAdmin?.isDevMode ?? true;
  const isCloud = isCloudRepositoryActive();

  const navItems = [
    {
      route: 'admin' as AppRoute,
      label: 'Overview',
      icon: LayoutDashboard,
      active: currentRoute === 'admin',
    },
    {
      route: 'admin-submissions' as AppRoute,
      label: 'Submissions',
      icon: Users,
      active: currentRoute === 'admin-submissions' || currentRoute === 'admin-submission-detail',
    },
    {
      route: 'admin-reflections' as AppRoute,
      label: 'Honest Inbox',
      icon: MessageSquareHeart,
      active: currentRoute === 'admin-reflections',
    },
    {
      route: 'admin-analytics' as AppRoute,
      label: 'Analytics',
      icon: BarChart3,
      active: currentRoute === 'admin-analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Cloud Status / Local Preview Banner */}
      {!isCloud ? (
        <aside
          id="admin-dev-notice-banner"
          aria-label="Local Preview notice"
          className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs px-4 py-2 flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Local Preview:</strong> Running via browser local storage. Firebase credentials are not configured. Submissions from other devices will not synchronize until Firebase is configured in .env.
            </span>
          </div>
          <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider text-amber-300">
            Local Storage
          </span>
        </aside>
      ) : isDevMode ? (
        <aside
          id="admin-dev-notice-banner"
          aria-label="Development mode notice"
          className="bg-blue-500/15 border-b border-blue-500/30 text-blue-200 text-xs px-4 py-2 flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Cloud Connected:</strong> Firestore is active. Submissions from participants on all devices are securely synchronized to Cloud Firestore.
            </span>
          </div>
          <span className="bg-blue-500/20 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider text-blue-300">
            Cloud Firestore
          </span>
        </aside>
      ) : null}

      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand / Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold font-['Outfit'] text-white tracking-tight">
                    Forsyth Admin Dashboard
                  </h1>
                  {isCloud ? (
                    <span
                      id="admin-status-cloud-badge"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Cloud Connected
                    </span>
                  ) : (
                    <span
                      id="admin-status-local-badge"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Local Preview
                    </span>
                  )}
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
                    Private
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Submissions, Honest Room responses & question performance
                </p>
              </div>
            </div>

            {/* Admin Right Actions */}
            <div className="flex items-center gap-2">
              <button
                id="admin-return-quiz-btn"
                onClick={onReturnToApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors min-h-[40px] cursor-pointer"
                title="Return to public participant view"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Participant View</span>
              </button>

              <button
                id="admin-sign-out-btn"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors min-h-[40px] cursor-pointer"
                title="Sign out of admin session"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-800/60 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  id={`admin-tab-${item.route}`}
                  onClick={() => onNavigate(item.route)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                    item.active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <p>Private Admin View · Do You Really Know Forsyth? · Strict Data Confidentiality</p>
      </footer>
    </div>
  );
};
