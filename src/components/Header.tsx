import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { AppRoute, ParticipantIdentity } from '../types';

interface HeaderProps {
  currentRoute: AppRoute;
  participant: ParticipantIdentity | null;
  onReset: () => void;
  inProgress: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  participant,
  onReset,
  inProgress,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-[#0B132B]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[720px] mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Brand identity */}
        <div
          id="app-header-brand"
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={currentRoute !== 'landing' && !inProgress ? onReset : undefined}
          role={currentRoute !== 'landing' && !inProgress ? 'button' : undefined}
          tabIndex={currentRoute !== 'landing' && !inProgress ? 0 : -1}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && currentRoute !== 'landing' && !inProgress) {
              onReset();
            }
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-lg">
            F
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-['Outfit'] leading-tight flex items-center gap-1.5">
              Do You Really Know Forsyth?
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline" />
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              The social challenge & knowledge quiz
            </p>
          </div>
        </div>

        {/* User indicator / Reset button */}
        <div className="flex items-center gap-2">
          {participant && (
            <span
              id="header-participant-badge"
              className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 max-w-[130px] truncate"
              title={participant.type === 'named' ? participant.displayName || '' : 'Anonymous'}
            >
              {participant.type === 'named' ? participant.displayName : 'Anonymous'}
            </span>
          )}

          {inProgress && (
            <button
              id="header-restart-btn"
              onClick={onReset}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              title="Restart Quiz"
              aria-label="Restart Quiz"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
