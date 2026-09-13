import React from 'react';
import { Sparkles, ArrowRight, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { QuizSession } from '../types';

interface LandingViewProps {
  onStart: () => void;
  activeSession: QuizSession | null;
  onResume: () => void;
  onClearSession: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStart,
  activeSession,
  onResume,
  onClearSession,
}) => {
  const hasIncompleteQuiz =
    activeSession &&
    !activeSession.isCompleted &&
    activeSession.shuffledQuestions.length > 0;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Resume Banner if user has saved progress */}
      {hasIncompleteQuiz && (
        <div
          id="landing-resume-card"
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40 text-left shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-1.5">
                <RotateCcw className="w-3 h-3" /> Unfinished Challenge
              </span>
              <p className="text-sm font-semibold text-white">
                You have a quiz in progress (Question {activeSession.currentQuestionIndex + 1} of{' '}
                {activeSession.shuffledQuestions.length})
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Participant:{' '}
                <span className="text-amber-300 font-medium">
                  {activeSession.participant.type === 'named'
                    ? activeSession.participant.displayName
                    : 'Anonymous'}
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <button
                id="landing-resume-btn"
                onClick={onResume}
                className="px-4 py-2.5 min-h-[44px] text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Resume <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="landing-discard-btn"
                onClick={onClearSession}
                className="px-3 py-2.5 min-h-[44px] text-xs font-medium text-slate-400 hover:text-red-300 transition-colors cursor-pointer inline-flex items-center"
              >
                Start fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Hero Card */}
      <div
        id="landing-card"
        className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-blue-950/40 text-slate-900 border border-slate-100 relative overflow-hidden"
      >
        {/* Playful top badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-bold border border-blue-200/70 mb-5">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>The Official Forsyth Social Challenge</span>
        </div>

        {/* Copy from spec */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Outfit'] text-slate-950 mb-3 leading-tight">
          You know the name.
          <br />
          <span className="text-blue-600">But do you really know Forsyth?</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
          Put your knowledge to the test with rapid-fire questions covering his origins, daily quirks,
          football loyalties, and deepest values. Find out your certified friendship tier!
        </p>

        {/* Feature highlight pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Quick &amp; Full Modes
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Instant Truth Reveals
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Private Honest Room
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id="landing-start-btn"
          onClick={onStart}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-3 cursor-pointer focus-visible:ring-4 focus-visible:ring-blue-300 min-h-[52px]"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>Start Challenge</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Footnote */}
        <p className="text-xs text-slate-400 mt-4">
          No login required · Play under your name or anonymously
        </p>
      </div>
    </div>
  );
};
