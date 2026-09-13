import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ShuffledQuestion, AnswerRecord, QuestionOption } from '../types';

interface QuizViewProps {
  question: ShuffledQuestion;
  questionIndex: number;
  totalQuestions: number;
  existingAnswer: AnswerRecord | undefined;
  onAnswerQuestion: (questionId: number, selectedOption: QuestionOption) => void;
  onNextQuestion: () => void;
  participantName: string | null;
  isSubmitting?: boolean;
  saveError?: string | null;
  onRetrySubmit?: () => void;
  onContinueAnyway?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  question,
  questionIndex,
  totalQuestions,
  existingAnswer,
  onAnswerQuestion,
  onNextQuestion,
  participantName,
  isSubmitting = false,
  saveError = null,
  onRetrySubmit,
  onContinueAnyway,
}) => {
  // If this question was already answered (e.g. after refresh), use it
  const isAnswered = !!existingAnswer;
  const selectedOptionId = existingAnswer?.selectedOptionId || null;
  const isCorrect = existingAnswer?.isCorrect || false;

  const [selectedId, setSelectedId] = useState<string | null>(selectedOptionId);

  // Synchronize when question index changes
  const activeSelectedId = existingAnswer ? existingAnswer.selectedOptionId : selectedId;

  const handleOptionClick = (option: QuestionOption) => {
    if (isAnswered) return;
    setSelectedId(option.id);
    onAnswerQuestion(question.id, option);
  };

  const progressPercentage = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = questionIndex === totalQuestions - 1;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Quiz Card */}
      <div
        id={`quiz-question-card-${question.id}`}
        className="w-full bg-white rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl shadow-blue-950/40 text-slate-900 border border-slate-100 relative"
      >
        {/* Progress & Category Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              id="quiz-progress-badge"
              className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80"
            >
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            {question.category && (
              <span className="hidden xs:inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                {question.category}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">
              {progressPercentage}% Completed
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div
          className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden"
          role="progressbar"
          aria-valuenow={questionIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-label={`Question ${questionIndex + 1} of ${totalQuestions}`}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Question Prompt */}
        <div className="mb-6 sm:mb-8">
          <h2
            id={`question-prompt-${question.id}`}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-950 font-['Outfit'] leading-snug tracking-tight"
          >
            {question.prompt}
          </h2>
        </div>

        {/* Options List */}
        <div
          id="quiz-options-container"
          role="radiogroup"
          aria-labelledby={`question-prompt-${question.id}`}
          className="space-y-3 mb-6"
        >
          {question.shuffledOptions.map((option, idx) => {
            const isThisSelected = activeSelectedId === option.id;
            const isThisCanonicalCorrect = option.id === question.correctOptionId;

            // Determine styling based on answered state
            let optionStyles =
              'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-slate-800 bg-white';
            let indicatorStyles = 'border-slate-300 text-slate-500 bg-slate-100';

            if (isAnswered) {
              if (isThisCanonicalCorrect) {
                // Highlight correct answer
                optionStyles =
                  'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-2 ring-emerald-500/20';
                indicatorStyles = 'border-emerald-500 bg-emerald-500 text-white';
              } else if (isThisSelected && !isCorrect) {
                // User picked wrong answer
                optionStyles =
                  'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20';
                indicatorStyles = 'border-red-500 bg-red-500 text-white';
              } else {
                // Neutral unselected wrong option
                optionStyles = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                indicatorStyles = 'border-slate-200 text-slate-300 bg-slate-100';
              }
            } else if (isThisSelected) {
              optionStyles =
                'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20';
              indicatorStyles = 'border-blue-600 bg-blue-600 text-white';
            }

            return (
              <button
                key={option.id}
                id={`quiz-option-${option.id}`}
                role="radio"
                aria-checked={isThisSelected}
                disabled={isAnswered}
                onClick={() => handleOptionClick(option)}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all min-h-[56px] text-sm sm:text-base cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                  isAnswered ? 'cursor-default' : ''
                } ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${indicatorStyles}`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium leading-normal">{option.label}</span>
                </div>

                {/* State Icons */}
                {isAnswered && isThisCanonicalCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && isThisSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Forsyth's Actual Answer Reveal Banner */}
        {isAnswered && (
          <div
            id="quiz-feedback-banner"
            role="status"
            aria-live="polite"
            className={`p-4 sm:p-5 rounded-2xl mb-6 border transition-all ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300/80 text-emerald-900'
                : 'bg-red-50/80 border-red-300/80 text-red-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <XCircle className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-base sm:text-lg font-['Outfit']">
                    {isCorrect ? 'Spot On!' : 'Not Quite!'}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/70 border border-current/20">
                    {isCorrect ? '+1 Point' : '+0 Points'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed mb-2 text-slate-700">
                  {isCorrect
                    ? `You definitely know Forsyth! That's correct.`
                    : `${participantName || 'You'} picked "${existingAnswer.selectedOptionLabel}", but...`}
                </p>

                {/* Forsyth's Actual Answer */}
                <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Forsyth&apos;s Actual Answer
                  </span>
                  <span className="text-slate-950 font-bold">{question.correctAnswerText}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Error & Retry Banner */}
        {saveError && isLastQuestion && (
          <div
            id="quiz-save-error-banner"
            role="alert"
            className="p-4 sm:p-5 rounded-2xl mb-4 bg-amber-50 border border-amber-300 text-amber-950 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm sm:text-base text-amber-950 mb-1 font-['Outfit']">
                  Cloud Synchronization Note
                </h4>
                <p className="text-xs sm:text-sm text-amber-900 mb-3 leading-relaxed">
                  Your quiz is complete and your score is safely stored on your device! We had trouble recording it to Cloud Firestore: <span className="font-mono text-xs">{saveError}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {onRetrySubmit && (
                    <button
                      id="quiz-retry-save-btn"
                      type="button"
                      onClick={onRetrySubmit}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Retry Cloud Save</span>
                        </>
                      )}
                    </button>
                  )}
                  {onContinueAnyway && (
                    <button
                      id="quiz-continue-anyway-btn"
                      type="button"
                      onClick={onContinueAnyway}
                      className="px-4 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-950 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      View Results Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continue / See My Results Button */}
        {isAnswered && (
          <button
            id="quiz-continue-btn"
            onClick={onNextQuestion}
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:ring-4 focus-visible:ring-blue-300 min-h-[52px] ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed opacity-90 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Saving Your Results...</span>
              </>
            ) : isLastQuestion ? (
              <>
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>See My Results</span>
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
