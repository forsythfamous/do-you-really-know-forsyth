import React, { useState } from 'react';
import { ArrowLeft, Send, Edit2, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { ParticipantIdentity } from '../types';
import { HONEST_ROOM_QUESTIONS } from '../data/honestQuestions';

interface HonestRoomReviewViewProps {
  participant: ParticipantIdentity;
  reflections: Record<number, string>;
  isSubmitting: boolean;
  submissionError?: string | null;
  onEditQuestion: (questionIndex: number) => void;
  onSubmitFinal: () => void;
  onBackToQuestions: () => void;
}

export const HonestRoomReviewView: React.FC<HonestRoomReviewViewProps> = ({
  participant,
  reflections,
  isSubmitting,
  submissionError,
  onEditQuestion,
  onSubmitFinal,
  onBackToQuestions,
}) => {
  const [confirmedPrivacy, setConfirmedPrivacy] = useState(true);

  const answeredCount = Object.values(reflections).filter(
    (val) => typeof val === 'string' && val.trim().length > 0,
  ).length;

  return (
    <div
      id="honest-review-container"
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/80 text-slate-900 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <button
          id="honest-review-back-btn"
          onClick={onBackToQuestions}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1.5 min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompts</span>
        </button>

        <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Private Submission</span>
        </div>
      </div>

      {/* Title & Summary */}
      <div className="mb-8">
        <h2
          id="honest-review-title"
          className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-['Outfit'] tracking-tight mb-2"
        >
          Review Your Reflections
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Take a moment to review before submitting. You answered{' '}
          <strong className="text-slate-900">{answeredCount}</strong> of{' '}
          <strong>{HONEST_ROOM_QUESTIONS.length}</strong> prompts. Submitting as{' '}
          <strong className="text-slate-900">
            {participant.type === 'named' && participant.displayName
              ? participant.displayName
              : 'Anonymous'}
          </strong>
          .
        </p>
      </div>

      {/* Warning if 0 answered */}
      {answeredCount === 0 && (
        <div
          id="honest-zero-answers-warning"
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-900">
            You haven’t answered any reflections yet. All questions are optional, so you may submit an empty confession or go back to write your thoughts.
          </p>
        </div>
      )}

      {/* Error banner if submission failed */}
      {submissionError && (
        <div
          id="honest-submission-error"
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm"
        >
          {submissionError}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4 mb-8">
        {HONEST_ROOM_QUESTIONS.map((q, idx) => {
          const answer = reflections[q.id]?.trim();
          const hasAnswer = Boolean(answer && answer.length > 0);

          return (
            <div
              key={q.id}
              id={`review-item-${q.id}`}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-['Outfit']">
                  Prompt {idx + 1} • {q.category}
                </span>
                <button
                  id={`review-edit-btn-${q.id}`}
                  onClick={() => onEditQuestion(idx)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 min-h-[36px] rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  title={`Edit prompt ${idx + 1}`}
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                {q.prompt}
              </p>

              {hasAnswer ? (
                <p className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/60 whitespace-pre-wrap leading-relaxed">
                  {answer}
                </p>
              ) : (
                <p className="text-xs italic text-slate-400">
                  Skipped (No response provided)
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation & Final Submit */}
      <div className="pt-6 border-t border-slate-100">
        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
          <input
            id="honest-confirm-checkbox"
            type="checkbox"
            checked={confirmedPrivacy}
            onChange={(e) => setConfirmedPrivacy(e.target.checked)}
            className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <span className="text-xs sm:text-sm text-slate-600 leading-normal">
            I understand that these reflections will be delivered privately to Forsyth and will not be displayed on any public leaderboard.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id="honest-review-back-bottom-btn"
            onClick={onBackToQuestions}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to Prompts
          </button>

          <button
            id="honest-final-submit-btn"
            onClick={onSubmitFinal}
            disabled={isSubmitting || !confirmedPrivacy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base font-['Outfit'] shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-3 focus-visible:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting to Forsyth...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm &amp; Submit to Forsyth</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
