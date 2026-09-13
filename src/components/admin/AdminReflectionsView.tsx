import React, { useState, useMemo } from 'react';
import {
  MessageSquareHeart,
  Download,
  Filter,
  Search,
  Lock,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { QuizSubmission } from '../../types';
import { HONEST_ROOM_QUESTIONS } from '../../data/honestQuestions';
import { generateReflectionsCsv, downloadCsvFile } from '../../lib/csvExport';
import { AdminExportModal } from './AdminExportModal';

interface AdminReflectionsViewProps {
  submissions: QuizSubmission[];
}

export const AdminReflectionsView: React.FC<AdminReflectionsViewProps> = ({
  submissions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [participantTypeFilter, setParticipantTypeFilter] = useState<'all' | 'named' | 'anonymous'>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'skipped'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});
  const [showExportModal, setShowExportModal] = useState(false);

  // Submissions that engaged with or skipped Honest Room
  const eligibleSubmissions = useMemo(() => {
    return submissions.filter(
      (s) => s.reflectionCompletionStatus === 'completed' || s.reflectionCompletionStatus === 'skipped',
    );
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return eligibleSubmissions
      .filter((sub) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (sub.displayName || 'anonymous').toLowerCase();
          const idMatch = sub.submissionId.toLowerCase().includes(q);
          const textMatch = Object.values(sub.reflections || {}).some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(q),
          );
          if (!name.includes(q) && !idMatch && !textMatch) return false;
        }

        if (participantTypeFilter !== 'all' && sub.participantType !== participantTypeFilter) {
          return false;
        }

        if (completionFilter !== 'all' && sub.reflectionCompletionStatus !== completionFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      });
  }, [eligibleSubmissions, searchQuery, participantTypeFilter, completionFilter, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleConfirmExport = () => {
    const csvContent = generateReflectionsCsv(filteredSubmissions);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`forsyth-honest-reflections-CONFIDENTIAL-${dateStr}.csv`, csvContent);
  };

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-pink-950/20 border border-pink-500/20 rounded-3xl p-6 sm:p-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold text-[11px] uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Confidential Admin Inbox
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white mt-1.5">
            Honest Room Reflections
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Private feedback, memories, and personal impressions submitted by participants. Strictly isolated from all public routes and public analytics.
          </p>
        </div>

        <button
          id="admin-export-reflections-btn"
          disabled={filteredSubmissions.length === 0}
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-pink-600/25 transition-all cursor-pointer min-h-[44px] shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Reflections CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="admin-reflections-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 min-h-[40px]"
          />
        </div>

        <select
          id="admin-reflections-type-filter"
          aria-label="Filter by participant identity"
          value={participantTypeFilter}
          onChange={(e) => setParticipantTypeFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500 min-h-[40px]"
        >
          <option value="all">All Identities</option>
          <option value="named">Named Only</option>
          <option value="anonymous">Anonymous Only</option>
        </select>

        <select
          id="admin-reflections-status-filter"
          aria-label="Filter by completion status"
          value={completionFilter}
          onChange={(e) => setCompletionFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500 min-h-[40px]"
        >
          <option value="all">Completed & Skipped</option>
          <option value="completed">Completed Responses</option>
          <option value="skipped">Skipped Only</option>
        </select>

        <select
          id="admin-reflections-sort"
          aria-label="Sort reflections"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500 min-h-[40px]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Submissions Inbox List */}
      {filteredSubmissions.length === 0 ? (
        <div
          id="admin-reflections-empty"
          className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center"
        >
          <MessageSquareHeart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Honest Room reflections found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {eligibleSubmissions.length === 0
              ? 'When participants complete or skip the Honest Room after finishing their quiz, their responses will appear in this private inbox.'
              : 'Try clearing your search query or adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const isAnon = sub.participantType === 'anonymous';
            const participantLabel = isAnon ? 'Anonymous' : sub.displayName || 'Unnamed Participant';
            const isCompleted = sub.reflectionCompletionStatus === 'completed';
            const isExpanded = expandedSubmissions[sub.submissionId] ?? true; // expanded by default

            // Count answered prompts
            const answeredCount = HONEST_ROOM_QUESTIONS.filter(
              (q) => typeof sub.reflections?.[q.id] === 'string' && sub.reflections[q.id].trim().length > 0,
            ).length;

            return (
              <div
                key={sub.submissionId}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(sub.submissionId)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-950/60 border border-pink-800/50 flex items-center justify-center text-pink-400 shrink-0">
                      <MessageSquareHeart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${isAnon ? 'text-slate-400 italic' : 'text-white'}`}>
                          {participantLabel}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isAnon ? 'bg-slate-800 text-slate-400' : 'bg-blue-950 text-blue-300'
                          }`}
                        >
                          {isAnon ? 'Anonymous' : 'Named'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Submitted: {formatTimestamp(sub.submittedAt)}</span>
                        <span>·</span>
                        <span>Score: {sub.score}% ({sub.tier})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-pink-400 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> {answeredCount} of 10 answered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Skipped
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle submission reflections details"
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Answers (All 10 Canonical Prompts) */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
                    {!isCompleted ? (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                        Participant chose "Skip & Finish" at the Honest Room stage.
                      </div>
                    ) : (
                      HONEST_ROOM_QUESTIONS.map((q) => {
                        const response = sub.reflections?.[q.id];
                        const hasResponse = typeof response === 'string' && response.trim().length > 0;

                        return (
                          <div
                            key={q.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              hasResponse
                                ? 'bg-slate-900/90 border-slate-800'
                                : 'bg-slate-900/30 border-slate-800/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                              <span>Prompt #{q.id} · {q.category}</span>
                              <span className={hasResponse ? 'text-pink-400 font-bold' : 'text-slate-600'}>
                                {hasResponse ? 'Answered' : 'Unanswered / Skipped'}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-300 mb-2">
                              {q.prompt}
                            </p>

                            {/* Untrusted User Content: rendered strictly as text (safe from HTML injection) */}
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                              {hasResponse ? (
                                response
                              ) : (
                                <em className="text-slate-600 font-sans">(No response provided)</em>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Export Confirmation Modal */}
      <AdminExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirmExport={handleConfirmExport}
        submissionsCount={filteredSubmissions.length}
      />
    </div>
  );
};
