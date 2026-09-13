import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
  Zap,
  TrendingUp,
  MessageSquareHeart,
  ShieldCheck,
  User,
  Award,
} from 'lucide-react';
import { QuizSubmission } from '../../types';
import { CANONICAL_QUESTIONS } from '../../data/canonicalQuestions';
import { HONEST_ROOM_QUESTIONS } from '../../data/honestQuestions';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminSubmissionDetailViewProps {
  submission: QuizSubmission | null;
  onBack: () => void;
  onDeleteSubmission: (submissionId: string) => Promise<void>;
}

export const AdminSubmissionDetailView: React.FC<AdminSubmissionDetailViewProps> = ({
  submission,
  onBack,
  onDeleteSubmission,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!submission) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Submission not found or has been deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer"
        >
          ← Back to Submissions
        </button>
      </div>
    );
  }

  const isAnon = submission.participantType === 'anonymous';
  const participantLabel = isAnon ? 'Anonymous' : submission.displayName || 'Unnamed Participant';

  // Match questions by ID
  const questionMap = new Map(CANONICAL_QUESTIONS.map((q) => [q.id, q]));
  const honestMap = new Map(HONEST_ROOM_QUESTIONS.map((q) => [q.id, q]));

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      {/* Top Bar with Back & Delete */}
      <div className="flex items-center justify-between gap-4">
        <button
          id="admin-detail-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </button>

        <button
          id="admin-delete-submission-trigger-btn"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Submission</span>
        </button>
      </div>

      {/* Primary Summary Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold font-['Outfit'] text-white">
                {participantLabel}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold ${
                  isAnon
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {isAnon ? 'Anonymous' : 'Named'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              ID: {submission.submissionId}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-4xl font-extrabold font-['Outfit'] text-white flex items-center sm:justify-end gap-2">
              <span className={submission.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                {submission.score}%
              </span>
              <Award className="w-7 h-7 text-amber-400" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 mt-1">
              {submission.tier}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
              Quiz Mode
            </span>
            <div className="flex items-center gap-1.5 text-slate-200 font-bold mt-1">
              {submission.mode === 'quick' ? (
                <Zap className="w-4 h-4 text-indigo-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-purple-400" />
              )}
              <span>{submission.mode === 'quick' ? 'Quick Play' : 'Full Challenge'}</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
              Accuracy
            </span>
            <div className="text-slate-200 font-bold mt-1 font-mono text-sm">
              {submission.correctCount} / {submission.totalQuestions} correct
            </div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
              Honest Room Status
            </span>
            <div className="text-slate-200 font-bold mt-1 capitalize flex items-center gap-1.5">
              <MessageSquareHeart className="w-4 h-4 text-pink-400" />
              <span>{submission.reflectionCompletionStatus}</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
              Submitted At
            </span>
            <div className="text-slate-200 font-medium mt-1 text-[11px]">
              {formatTimestamp(submission.submittedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Scored Quiz Answers Review */}
      <section className="space-y-4" aria-labelledby="detail-answers-title">
        <div className="flex items-center justify-between">
          <h3 id="detail-answers-title" className="text-lg font-bold font-['Outfit'] text-white">
            Scored Quiz Answers ({submission.questionIds.length} questions presented)
          </h3>
          <span className="text-xs text-slate-400">
            {submission.correctCount} correct · {submission.totalQuestions - submission.correctCount} incorrect
          </span>
        </div>

        <div className="space-y-3">
          {submission.questionIds.map((qId, idx) => {
            const canonicalQ = questionMap.get(qId);
            const answerRecord = submission.selectedAnswers[qId];
            const isCorrect = answerRecord?.isCorrect === true;

            // Resolve Forsyth's canonical correct answer option
            const correctOpt = canonicalQ?.options.find(
              (o) => o.id === canonicalQ.correctOptionId,
            );

            return (
              <div
                key={qId}
                className={`p-4 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-red-950/15 border-red-900/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Question {idx + 1} (Canonical #{qId})
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200 leading-snug">
                      {canonicalQ?.prompt || `Question ID ${qId}`}
                    </h4>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold">
                        <XCircle className="w-4 h-4" /> Missed
                      </span>
                    )}
                  </div>
                </div>

                {/* Answers breakdown */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Participant Selected:
                    </span>
                    <span className={`font-semibold mt-0.5 block ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {answerRecord?.selectedOptionLabel || '(No response recorded)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Forsyth's Canonical Answer:
                    </span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {correctOpt?.label || canonicalQ?.correctOptionId || 'Not defined'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Associated Honest Room Reflections */}
      <section className="space-y-4" aria-labelledby="detail-reflections-title">
        <div className="flex items-center justify-between">
          <h3 id="detail-reflections-title" className="text-lg font-bold font-['Outfit'] text-white">
            Honest Room Reflections
          </h3>
          <span className="text-xs text-pink-400 font-semibold capitalize">
            Status: {submission.reflectionCompletionStatus}
          </span>
        </div>

        {submission.reflectionCompletionStatus === 'skipped' ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Participant chose "Skip & Finish" at the Honest Room stage.
          </div>
        ) : !submission.reflections || Object.keys(submission.reflections).length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
            No reflection responses recorded for this submission.
          </div>
        ) : (
          <div className="space-y-3">
            {HONEST_ROOM_QUESTIONS.map((q) => {
              const response = submission.reflections?.[q.id];
              const hasResponse = typeof response === 'string' && response.trim().length > 0;

              return (
                <div
                  key={q.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono uppercase tracking-wider font-bold">
                      Reflection #{q.id} · {q.category}
                    </span>
                    <span className={hasResponse ? 'text-pink-400 font-semibold' : 'text-slate-600'}>
                      {hasResponse ? 'Answered' : 'Skipped'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-300">
                    {q.prompt}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                    {hasResponse ? response : <em className="text-slate-500">(No response provided)</em>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <AdminDeleteModal
        submission={submission}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={async (subId) => {
          await onDeleteSubmission(subId);
          onBack();
        }}
      />
    </div>
  );
};
