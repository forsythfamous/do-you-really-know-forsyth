import React from 'react';
import { Zap, Trophy, ArrowRight, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { GameMode, ParticipantIdentity } from '../types';

interface ModeSelectionViewProps {
  participant: ParticipantIdentity;
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

export const ModeSelectionView: React.FC<ModeSelectionViewProps> = ({
  participant,
  onSelectMode,
  onBack,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        id="mode-selection-card"
        className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-blue-950/40 text-slate-900 border border-slate-100"
      >
        {/* Back navigation */}
        <button
          id="mode-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl px-3 py-2.5 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Name ({participant.type === 'named' ? participant.displayName : 'Anonymous'})</span>
        </button>

        {/* Step indicator */}
        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold">
          Step 2 of 2 · Choose Your Experience
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit'] text-slate-950 mb-2">
          Pick your challenge depth
        </h2>

        <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed">
          Welcome,{' '}
          <strong className="text-blue-600">
            {participant.type === 'named' ? participant.displayName : 'Anonymous player'}
          </strong>
          ! Ready to prove your Forsyth credentials?
        </p>

        {/* Mode cards list */}
        <div className="space-y-4 mb-6">
          {/* Quick Play */}
          <div
            id="mode-card-quick"
            className="p-5 rounded-2xl border-2 border-blue-500/80 bg-blue-50/30 hover:bg-blue-50/60 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <Zap className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                      Quick Play
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase rounded-full bg-blue-600 text-white">
                      Fast
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    12 questions · ~2 mins
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 pl-0.5 leading-relaxed">
              A rapid test featuring 12 randomized scored questions from Forsyth&apos;s canonical vault.
              Fast answers and instant truth reveals.
            </p>

            <button
              id="mode-select-quick-btn"
              onClick={() => onSelectMode('quick')}
              className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-blue-300 min-h-[46px]"
            >
              <span>Play Quick Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Full Challenge */}
          <div
            id="mode-card-full"
            className="p-5 rounded-2xl border-2 border-indigo-500/80 bg-indigo-50/30 hover:bg-indigo-50/60 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                      Full Challenge
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase rounded-full bg-indigo-600 text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Definitive
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    All 28 questions · The complete master test
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 pl-0.5 leading-relaxed">
              Every single canonical question, with Questions 61 &amp; 62 placed at the suspenseful finale.
              Proves whether you are true Inner-Circle material.
            </p>

            <button
              id="mode-select-full-btn"
              onClick={() => onSelectMode('full')}
              className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-indigo-300 min-h-[46px]"
            >
              <span>Play Full Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400">
            Scoring is deterministic. Honest Room reflections never affect quiz scores and remain private.
          </p>
        </div>
      </div>
    </div>
  );
};
