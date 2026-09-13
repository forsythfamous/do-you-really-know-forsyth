import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppRoute, ParticipantIdentity } from '../types';
import { isCloudRepositoryActive } from '../lib/repository';

interface LayoutProps {
  currentRoute: AppRoute;
  participant: ParticipantIdentity | null;
  onReset: () => void;
  inProgress: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentRoute,
  participant,
  onReset,
  inProgress,
  children,
}) => {
  const isCloud = isCloudRepositoryActive();

  return (
    <div className="min-h-screen flex flex-col bg-[#0B132B] text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-['Plus_Jakarta_Sans']">
      {/* Subtle ambient lighting glows */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/2 -right-40 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl"
        aria-hidden="true"
      />

      {/* Local Preview Mode Notice when Firebase credentials are not active */}
      {!isCloud && (
        <aside
          id="participant-local-preview-notice"
          className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>
            <strong>Local Preview:</strong> Storing results locally. Cloud synchronization activates once Firebase environment variables are provided.
          </span>
        </aside>
      )}

      {/* Header */}
      <Header
        currentRoute={currentRoute}
        participant={participant}
        onReset={onReset}
        inProgress={inProgress}
      />

      {/* Main content container */}
      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
