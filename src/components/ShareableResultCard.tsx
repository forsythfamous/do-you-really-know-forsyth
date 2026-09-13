import React from 'react';
import { Trophy, Sparkles, User, Award, ArrowUpRight } from 'lucide-react';

export interface ShareableResultCardProps {
  participantLabel: string;
  mode: 'quick' | 'full';
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  tierTitle: string;
  reaction: string;
}

export const ShareableResultCard: React.FC<ShareableResultCardProps> = ({
  participantLabel,
  mode,
  scorePercentage,
  correctCount,
  totalQuestions,
  tierTitle,
  reaction,
}) => {
  const modeLabel = mode === 'full' ? 'Full Challenge' : 'Quick Play';

  return (
    <div
      id="shareable-result-card"
      className="w-full max-w-lg mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-700/60 shadow-2xl relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Background ambient lighting accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Brand Title */}
      <div className="relative z-10 flex items-start justify-between gap-3 mb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block mb-1">
            THE OFFICIAL FRIENDSHIP TEST
          </span>
          <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
            Do You Really Know Forsyth?
          </h3>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Trophy className="w-6 h-6" />
        </div>
      </div>

      {/* 2 & 3. Badges: Mode & Participant Name */}
      <div className="relative z-10 flex items-center gap-2 mb-6 flex-wrap">
        <span
          id="card-mode-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {modeLabel}
        </span>

        <span
          id="card-participant-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-semibold"
        >
          <User className="w-3.5 h-3.5 text-slate-400" />
          {participantLabel}
        </span>
      </div>

      {/* 4 & 5. Score Hero & Correct Count */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-5">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Final Score
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              id="card-score-percentage"
              className="text-4xl sm:text-5xl font-black font-['Outfit'] text-amber-400 tracking-tight"
            >
              {scorePercentage}%
            </span>
          </div>
          <p id="card-correct-count" className="text-xs text-slate-300 font-medium mt-1">
            {correctCount} of {totalQuestions} correct
          </p>
        </div>

        {/* 6. Result Tier */}
        <div className="sm:border-l sm:border-slate-800 sm:pl-4">
          <span className="text-[11px] font-bold text-amber-300/90 uppercase tracking-wider block flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Tier Earned
          </span>
          <h4
            id="card-tier-title"
            className="text-base sm:text-lg font-extrabold text-white font-['Outfit'] mt-1 leading-snug"
          >
            {tierTitle}
          </h4>
        </div>
      </div>

      {/* 7. Short Playful Reaction */}
      <div
        id="card-reaction-box"
        className="relative z-10 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 mb-5 text-left"
      >
        <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
          &ldquo;{reaction}&rdquo;
        </p>
      </div>

      {/* 8. Invitation: "Think you know Forsyth better? Take the challenge." */}
      <div
        id="card-invitation"
        className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-sky-300 font-bold"
      >
        <span>Think you know Forsyth better? Take the challenge.</span>
        <ArrowUpRight className="w-4 h-4 text-sky-400" />
      </div>
    </div>
  );
};
