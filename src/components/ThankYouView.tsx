import React from 'react';
import { Heart, CheckCircle2, RotateCcw, Home, Sparkles } from 'lucide-react';
import { QuizSubmission } from '../types';

interface ThankYouViewProps {
  submission: QuizSubmission;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const ThankYouView: React.FC<ThankYouViewProps> = ({
  submission,
  onPlayAgain,
  onGoHome,
}) => {
  const isNamed = submission.participantType === 'named' && submission.displayName;
  const answeredReflectionsCount = submission.reflections
    ? Object.keys(submission.reflections).filter((k) => {
        const val = submission.reflections?.[Number(k)];
        return typeof val === 'string' && val.trim().length > 0;
      }).length
    : 0;

  const isSkipped = submission.reflectionCompletionStatus === 'skipped';
  const isCompletedReflections = submission.reflectionCompletionStatus === 'completed';

  return (
    <div
      id="thank-you-container"
      className="w-full max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/80 text-center text-slate-900 animate-fade-in"
    >
      <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center mb-6 shadow-sm">
        <Heart className="w-8 h-8 text-emerald-600 fill-emerald-600/20" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Submission Confirmed</span>
      </div>

      <h2
        id="thank-you-title"
        className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-['Outfit'] tracking-tight mb-3"
      >
        Thank you for playing{isNamed ? `, ${submission.displayName}` : ''}!
      </h2>

      <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed max-w-md mx-auto">
        {isCompletedReflections
          ? 'Your reflections and challenge results have been delivered privately to Forsyth. Your honesty and memories mean a lot.'
          : 'Your challenge performance has been saved. Thank you for proving how well you know Forsyth!'}
      </p>

      {/* Quiz details */}
      {typeof submission.score === 'number' && (
        <div
          id="thank-you-quiz-summary"
          className="mb-8 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit']">
              Challenge Record
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {submission.mode === 'full' ? 'Full Challenge (28 Qs)' : 'Quick Play (12 Qs)'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-950 font-['Outfit']">
              {submission.score}%
              <span className="text-xs font-medium text-slate-500 ml-1.5">
                ({submission.correctCount} of {submission.totalQuestions} correct)
              </span>
            </div>
            {submission.tier && (
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                {submission.tier}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Honest reflections summary badge */}
      {isCompletedReflections && (
        <div
          id="thank-you-reflections-summary"
          className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>
            {answeredReflectionsCount > 0
              ? `${answeredReflectionsCount} reflection${answeredReflectionsCount > 1 ? 's' : ''} submitted privately to Forsyth.`
              : 'Honest Room submitted privately.'}
          </span>
        </div>
      )}

      {isSkipped && (
        <div
          id="thank-you-reflections-summary"
          className="mb-8 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center justify-center gap-2"
        >
          <span>Honest Room skipped · Results safely recorded.</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          id="thank-you-play-again-btn"
          onClick={onPlayAgain}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer focus-visible:ring-3 focus-visible:ring-blue-400"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>

        <button
          id="thank-you-home-btn"
          onClick={onGoHome}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};
