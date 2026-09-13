import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Home,
  MessageSquareHeart,
  Zap,
  Share2,
  Copy,
  Download,
  Check,
  Bot,
  MessageCircle,
} from 'lucide-react';
import { ScoreCalculation, AnswerRecord, ShuffledQuestion, ParticipantIdentity, GameMode } from '../types';
import { fetchCommentary, formatShareText, getLocalFallbackCommentary } from '../lib/commentary';
import { launchConfetti } from '../lib/confetti';
import { downloadResultCardPng } from '../lib/cardRenderer';
import { ShareableResultCard } from './ShareableResultCard';

interface ResultsViewProps {
  scoreResult: ScoreCalculation;
  participant: ParticipantIdentity;
  mode: GameMode;
  shuffledQuestions: ShuffledQuestion[];
  answers: Record<number, AnswerRecord>;
  onReplayQuick: () => void;
  onReplayFull: () => void;
  onContinueHonestRoom: () => void;
  onSkipAndFinish: () => void;
  onGoHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  scoreResult,
  participant,
  mode,
  shuffledQuestions,
  answers,
  onReplayQuick,
  onReplayFull,
  onContinueHonestRoom,
  onSkipAndFinish,
  onGoHome,
}) => {
  const [showReview, setShowReview] = useState(true);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { correctCount, totalQuestions, scorePercentage, tier } = scoreResult;

  const modeDisplayName = mode === 'full' ? 'Full Challenge' : 'Quick Play';
  const participantLabel =
    participant.type === 'named' && participant.displayName?.trim()
      ? participant.displayName.trim()
      : 'Anonymous';

  // State for the playful personalized reaction
  const [commentary, setCommentary] = useState<string>(() =>
    getLocalFallbackCommentary(tier.title, scorePercentage),
  );
  const [commentarySource, setCommentarySource] = useState<'gemini' | 'fallback'>('fallback');
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(true);

  // Trigger restrained celebratory confetti for scores >= 71% (suppressed under prefers-reduced-motion)
  useEffect(() => {
    if (scorePercentage >= 71) {
      const cleanup = launchConfetti();
      return () => cleanup();
    }
  }, [scorePercentage]);

  // Fetch AI commentary if available, with instantaneous fallback guarantee
  useEffect(() => {
    let isMounted = true;

    fetchCommentary({
      participantLabel,
      mode,
      correctCount,
      totalQuestions,
      score: scorePercentage,
      tier: tier.title,
    })
      .then((res) => {
        if (isMounted) {
          setCommentary(res.commentary);
          setCommentarySource(res.source);
          setIsLoadingCommentary(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCommentary(getLocalFallbackCommentary(tier.title, scorePercentage));
          setCommentarySource('fallback');
          setIsLoadingCommentary(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [participantLabel, mode, correctCount, totalQuestions, scorePercentage, tier.title]);

  // Share Result (Web Share API with fallback to Clipboard)
  const handleShareResult = async () => {
    const shareText = formatShareText(
      scorePercentage,
      tier.title,
      typeof window !== 'undefined' ? window.location.origin : '',
    );

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Do You Really Know Forsyth?',
          text: shareText,
          url: typeof window !== 'undefined' ? window.location.origin : '',
        });
        setShareStatus('Result shared successfully!');
        setTimeout(() => setShareStatus(null), 3000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // User cancelled share dialog
      }
    }

    // Fallback directly to clipboard
    await handleCopyResult();
  };

  // Copy Result Text
  const handleCopyResult = async () => {
    const shareText = formatShareText(
      scorePercentage,
      tier.title,
      typeof window !== 'undefined' ? window.location.origin : '',
    );

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setShareStatus('Result copied to clipboard! Ready to paste.');
      setTimeout(() => setShareStatus(null), 3500);
    } catch {
      setShareStatus('Could not access clipboard automatically.');
      setTimeout(() => setShareStatus(null), 3500);
    }
  };

  // Download Result Card as PNG
  const handleDownloadCard = async () => {
    try {
      setIsDownloading(true);
      await downloadResultCardPng({
        participantLabel,
        mode,
        scorePercentage,
        correctCount,
        totalQuestions,
        tierTitle: tier.title,
        reaction: commentary,
      });
      setShareStatus('Result card PNG downloaded successfully!');
      setTimeout(() => setShareStatus(null), 3500);
    } catch {
      setShareStatus('Could not download image. Please try copying the text instead.');
      setTimeout(() => setShareStatus(null), 3500);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-6">
      {/* Results Main Card */}
      <div
        id="results-card"
        className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-blue-950/40 text-slate-900 border border-slate-100 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
      >
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-100 text-amber-900 shadow-xl shadow-amber-500/20 mb-4 border-2 border-amber-300 animate-in zoom-in-90 duration-300 motion-reduce:animate-none">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-800" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <div
              id="results-mode-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{modeDisplayName} ({totalQuestions} Questions)</span>
            </div>

            <div
              id="results-participant-badge"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
            >
              <span>Played by:</span>
              <strong className="text-slate-900">{participantLabel}</strong>
            </div>
          </div>

          <h2
            id="results-tier-title"
            className="text-2xl sm:text-4xl font-extrabold text-slate-950 font-['Outfit'] tracking-tight mb-1"
          >
            {tier.title}
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Tone: <span className="italic text-slate-700">{tier.tone}</span>
          </p>
        </div>

        {/* Big Score Box */}
        <div
          id="results-score-box"
          className="p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/50 border border-blue-100 text-center mb-6"
        >
          <div className="flex items-baseline justify-center gap-2">
            <span
              id="results-percentage"
              className="text-5xl sm:text-6xl font-black font-['Outfit'] text-blue-600 tracking-tight"
            >
              {scorePercentage}%
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-400">score</span>
          </div>

          <p id="results-count-summary" className="text-sm sm:text-base font-bold text-slate-700 mt-1">
            {correctCount} out of {totalQuestions} answers correct
          </p>

          <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white shadow-sm border border-slate-200 text-xs font-bold text-slate-600">
            Tier Badge: <span className="text-blue-700">{tier.badgeLabel}</span>
          </div>
        </div>

        {/* Playful Reaction Box (Gemini Personalized or Local Fallback) */}
        <div
          id="results-reaction-box"
          className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 mb-6 text-center sm:text-left flex items-start gap-3.5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 hidden sm:flex">
            {commentarySource === 'gemini' ? (
              <Bot className="w-5 h-5 text-blue-600" />
            ) : (
              <MessageCircle className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Forsyth&apos;s Reaction
              </h4>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                {commentarySource === 'gemini' ? 'AI Reaction' : 'Personalized Note'}
              </span>
            </div>
            <p
              id="results-commentary-text"
              className={`text-sm sm:text-base leading-relaxed text-slate-800 italic ${
                isLoadingCommentary ? 'opacity-70' : 'opacity-100'
              }`}
            >
              &ldquo;{commentary}&rdquo;
            </p>
          </div>
        </div>

        {/* Shareable Card Section */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Shareable Result Card
            </h3>
            <span className="text-[11px] text-slate-500">
              Includes only public score, tier &amp; invitation
            </span>
          </div>

          {/* Shareable Card Component */}
          <ShareableResultCard
            participantLabel={participantLabel}
            mode={mode}
            scorePercentage={scorePercentage}
            correctCount={correctCount}
            totalQuestions={totalQuestions}
            tierTitle={tier.title}
            reaction={commentary}
          />

          {/* Share Feedback Toast */}
          {shareStatus && (
            <div
              id="share-feedback-toast"
              role="status"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareStatus}</span>
            </div>
          )}

          {/* Working Sharing Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              id="results-share-btn"
              type="button"
              onClick={handleShareResult}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px]"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Result</span>
            </button>

            <button
              id="results-copy-btn"
              type="button"
              onClick={handleCopyResult}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[44px]"
            >
              <Copy className="w-4 h-4 text-slate-600" />
              <span>Copy Result Text</span>
            </button>

            <button
              id="results-download-card-btn"
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadCard}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[44px] disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{isDownloading ? 'Generating...' : 'Download Card PNG'}</span>
            </button>
          </div>
        </div>

        {/* Primary Call to Action: Continue to Honest Room */}
        <div
          id="results-honest-room-cta"
          className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <MessageSquareHeart className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold font-['Outfit'] text-white">
                Continue to the Honest Room
              </h4>
              <p className="text-xs text-slate-300">
                The quiz is over. Now leave your private impressions, memories &amp; confessions for Forsyth.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="results-skip-finish-btn"
              onClick={onSkipAndFinish}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-600 text-slate-200 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
            >
              <span>Skip &amp; Finish</span>
            </button>

            <button
              id="results-continue-honest-btn"
              onClick={onContinueHonestRoom}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-sm transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-blue-400 min-h-[44px]"
            >
              <span>Enter Honest Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Replay & Return Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <button
            id="results-replay-quick-btn"
            onClick={onReplayQuick}
            className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[46px]"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Replay Quick Play</span>
          </button>

          <button
            id="results-replay-full-btn"
            onClick={onReplayFull}
            className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[46px]"
          >
            <RotateCcw className="w-4 h-4 text-blue-500" />
            <span>Replay Full Challenge</span>
          </button>

          <button
            id="results-home-btn"
            onClick={onGoHome}
            className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[46px]"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Return Home</span>
          </button>
        </div>

        {/* Detailed Answer Review */}
        <div id="results-review-section" className="border-t border-slate-200 pt-6">
          <button
            id="results-toggle-review-btn"
            onClick={() => setShowReview(!showReview)}
            className="w-full flex items-center justify-between py-3 px-1 min-h-[44px] text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-['Outfit']">Answer Review</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {correctCount}/{totalQuestions}
              </span>
            </div>
            {showReview ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showReview && (
            <div className="space-y-3 mt-4">
              {shuffledQuestions.map((q, idx) => {
                const answer = answers[q.id];
                const isItemCorrect = answer?.isCorrect || false;

                return (
                  <div
                    key={q.id}
                    id={`review-item-${q.id}`}
                    className={`p-4 rounded-xl border text-sm transition-all ${
                      isItemCorrect
                        ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                        : 'bg-red-50/50 border-red-200/80 text-red-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="font-bold text-slate-900 leading-snug">
                        <span className="text-slate-400 font-semibold mr-1.5">{idx + 1}.</span>
                        {q.prompt}
                      </p>
                      {isItemCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-md shrink-0">
                          <XCircle className="w-3.5 h-3.5" /> Missed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Your answer: </span>
                        <span
                          className={`font-semibold ${
                            isItemCorrect ? 'text-emerald-700' : 'text-red-700 line-through'
                          }`}
                        >
                          {answer ? answer.selectedOptionLabel : 'Not answered'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Forsyth&apos;s answer: </span>
                        <span className="font-bold text-slate-900">
                          {q.correctAnswerText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
