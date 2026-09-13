import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, CornerDownRight, CheckCircle, AlertCircle, FastForward } from 'lucide-react';
import { HonestRoomQuestion, ParticipantIdentity } from '../types';
import { HONEST_ROOM_QUESTIONS, THREE_WORDS_QUESTION_ID, validateThreeWordsAnswer } from '../data/honestQuestions';

interface HonestRoomViewProps {
  participant: ParticipantIdentity;
  currentQuestionIndex: number;
  reflections: Record<number, string>;
  onAnswerChange: (questionId: number, text: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onReview: () => void;
  onDiscard: () => void;
  onSkipAndFinish: () => void;
}

export const HonestRoomView: React.FC<HonestRoomViewProps> = ({
  participant,
  currentQuestionIndex,
  reflections,
  onAnswerChange,
  onNext,
  onPrev,
  onSkip,
  onReview,
  onDiscard,
  onSkipAndFinish,
}) => {
  const currentQuestion: HonestRoomQuestion =
    HONEST_ROOM_QUESTIONS[currentQuestionIndex] || HONEST_ROOM_QUESTIONS[0];

  const isThreeWordsQuestion = currentQuestion.id === THREE_WORDS_QUESTION_ID;
  const currentAnswer = reflections[currentQuestion.id] || '';
  const [localText, setLocalText] = useState(currentAnswer);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync local text when question changes
  useEffect(() => {
    setLocalText(reflections[currentQuestion.id] || '');
    setValidationError(null);
  }, [currentQuestion.id, reflections]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 500);
    setLocalText(val);
    onAnswerChange(currentQuestion.id, val);

    if (isThreeWordsQuestion) {
      const check = validateThreeWordsAnswer(val);
      if (!check.isValid && val.trim().length > 0) {
        setValidationError(check.error || 'Please enter exactly three words.');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  };

  const handleContinue = () => {
    // Validate Question 56 if answered
    if (isThreeWordsQuestion && localText.trim().length > 0) {
      const check = validateThreeWordsAnswer(localText);
      if (!check.isValid) {
        setValidationError(check.error || 'Please enter exactly three words, or leave blank to skip.');
        return;
      }
    }
    setValidationError(null);
    onNext();
  };

  const isLastQuestion = currentQuestionIndex === HONEST_ROOM_QUESTIONS.length - 1;
  const answeredCount = Object.keys(reflections).filter(
    (key) => typeof reflections[Number(key)] === 'string' && reflections[Number(key)].trim().length > 0,
  ).length;

  return (
    <div
      id="honest-room-container"
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/80 text-slate-900 animate-fade-in"
    >
      {/* Top Header: Navigation & Privacy Indicator */}
      <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <button
          id="honest-discard-btn"
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer px-2 py-1.5 min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Exit Honest Room and return to results"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div
          id="honest-privacy-badge"
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Private to Forsyth</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="honest-skip-all-btn"
            onClick={onSkipAndFinish}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1.5 min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-1"
            title="Skip reflections and finish"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Skip &amp; Finish</span>
          </button>

          <button
            id="honest-jump-review-btn"
            onClick={onReview}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-2 py-1.5 min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Review ({answeredCount}/10)
          </button>
        </div>
      </div>

      {/* Intro Banner */}
      <div id="honest-intro-banner" className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
        <p className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit'] mb-1">
          The quiz is over. Now tell Forsyth what you really think.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your responses are private to Forsyth. Every question is optional, and you may skip anything you do not want to answer.
          {participant.type === 'named' && participant.displayName ? (
            <span className="font-semibold text-slate-800 ml-1">
              (Submitting as {participant.displayName})
            </span>
          ) : (
            <span className="font-semibold text-slate-800 ml-1">
              (Submitting anonymously)
            </span>
          )}
        </p>
      </div>

      {/* Progress Bar & Prompt Counter */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span className="uppercase tracking-wider font-['Outfit'] text-slate-700">
            {currentQuestion.category}
          </span>
          <span>
            Prompt {currentQuestionIndex + 1} of {HONEST_ROOM_QUESTIONS.length}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            id="honest-progress-bar"
            className="h-full bg-slate-900 transition-all duration-300 rounded-full"
            style={{
              width: `${((currentQuestionIndex + 1) / HONEST_ROOM_QUESTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mb-6">
        <h2
          id={`honest-prompt-${currentQuestion.id}`}
          className="text-xl sm:text-2xl font-extrabold text-slate-950 font-['Outfit'] leading-snug tracking-tight mb-2"
        >
          {currentQuestion.prompt}
        </h2>
        {isThreeWordsQuestion && (
          <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl inline-block mt-1">
            Tip: Enter exactly 3 words separated by spaces (e.g. &ldquo;Ambitious, thoughtful, witty&rdquo;), or skip.
          </p>
        )}
      </div>

      {/* Textarea Input */}
      <div className="mb-6">
        <label
          htmlFor="honest-response-input"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-['Outfit']"
        >
          Your Reflection (Optional)
        </label>
        <textarea
          id="honest-response-input"
          rows={5}
          value={localText}
          onChange={handleTextChange}
          placeholder={
            isThreeWordsQuestion
              ? 'Three words only...'
              : 'Speak your truth freely and honestly...'
          }
          className="w-full p-4 rounded-2xl border border-slate-300 text-slate-900 placeholder:text-slate-400 text-base leading-relaxed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500 transition-all resize-y min-h-[130px]"
        />

        {/* Counter and Validation row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
          <div id="honest-validation-feedback" role="status" aria-live="polite">
            {validationError ? (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validationError}
              </p>
            ) : isThreeWordsQuestion && localText.trim().length > 0 ? (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Valid 3-word phrase
              </p>
            ) : null}
          </div>

          <div
            id="honest-character-counter"
            className={`font-mono text-xs ${
              localText.length >= 480 ? 'text-amber-600 font-bold' : 'text-slate-400'
            }`}
          >
            {localText.length} / 500 characters
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="honest-prev-btn"
            onClick={onPrev}
            disabled={currentQuestionIndex === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            id="honest-skip-btn"
            onClick={onSkip}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[44px] rounded-xl text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span>Skip</span>
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          id="honest-continue-btn"
          onClick={handleContinue}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer focus-visible:ring-3 focus-visible:ring-blue-400"
        >
          <span>{isLastQuestion ? 'Review All Responses' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
