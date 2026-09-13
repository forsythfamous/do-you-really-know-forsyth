import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { QuizSubmission, SubmissionFilters } from '../../types';
import { generateSubmissionsCsv, downloadCsvFile } from '../../lib/csvExport';

interface AdminSubmissionsViewProps {
  submissions: QuizSubmission[];
  onSelectSubmission: (submissionId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const DEFAULT_FILTERS: SubmissionFilters = {
  searchQuery: '',
  mode: 'all',
  participantType: 'all',
  tier: 'all',
  reflectionStatus: 'all',
  sortBy: 'newest',
};

export const AdminSubmissionsView: React.FC<AdminSubmissionsViewProps> = ({
  submissions,
  onSelectSubmission,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [filters, setFilters] = useState<SubmissionFilters>(DEFAULT_FILTERS);

  // Extract unique tiers present in the dataset
  const uniqueTiers = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.tier) set.add(s.tier);
    });
    return Array.from(set);
  }, [submissions]);

  // Filter & Sort Logic
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        // Search query (matches display name or submission ID)
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const name = (sub.displayName || 'anonymous').toLowerCase();
          const idMatch = sub.submissionId.toLowerCase().includes(q);
          if (!name.includes(q) && !idMatch) return false;
        }

        // Mode
        if (filters.mode !== 'all' && sub.mode !== filters.mode) {
          return false;
        }

        // Participant Type
        if (filters.participantType !== 'all' && sub.participantType !== filters.participantType) {
          return false;
        }

        // Result Tier
        if (filters.tier !== 'all' && sub.tier !== filters.tier) {
          return false;
        }

        // Reflection Status
        if (filters.reflectionStatus !== 'all' && sub.reflectionCompletionStatus !== filters.reflectionStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        if (filters.sortBy === 'oldest') {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (filters.sortBy === 'score_high') {
          return b.score - a.score;
        }
        if (filters.sortBy === 'score_low') {
          return a.score - b.score;
        }
        return 0;
      });
  }, [submissions, filters]);

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleExportCsv = () => {
    if (filteredSubmissions.length === 0) return;
    const csvData = generateSubmissionsCsv(filteredSubmissions);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`forsyth-quiz-submissions-${dateStr}.csv`, csvData);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
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
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white">
            Quiz Submissions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {filteredSubmissions.length} of {submissions.length} completed participant submissions
          </p>
        </div>

        <button
          id="admin-export-submissions-csv-btn"
          disabled={filteredSubmissions.length === 0}
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>Export Submissions CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="admin-filter-search"
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by participant name..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 min-h-[40px]"
            />
          </div>

          {/* Mode Select */}
          <div>
            <select
              id="admin-filter-mode"
              aria-label="Filter by quiz mode"
              value={filters.mode}
              onChange={(e) => setFilters({ ...filters, mode: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 min-h-[40px]"
            >
              <option value="all">All Modes</option>
              <option value="quick">Quick Play (12)</option>
              <option value="full">Full Challenge (28)</option>
            </select>
          </div>

          {/* Participant Type Select */}
          <div>
            <select
              id="admin-filter-type"
              aria-label="Filter by participant type"
              value={filters.participantType}
              onChange={(e) => setFilters({ ...filters, participantType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 min-h-[40px]"
            >
              <option value="all">All Identity Types</option>
              <option value="named">Named Only</option>
              <option value="anonymous">Anonymous Only</option>
            </select>
          </div>

          {/* Result Tier Select */}
          <div>
            <select
              id="admin-filter-tier"
              aria-label="Filter by result tier"
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 min-h-[40px]"
            >
              <option value="all">All Result Tiers</option>
              {uniqueTiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div>
            <select
              id="admin-filter-sort"
              aria-label="Sort submissions"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 min-h-[40px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score_high">Highest Score</option>
              <option value="score_low">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Secondary row with Honest status and Clear button */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Honest Room:</span>
            <div className="flex gap-1">
              {(['all', 'completed', 'skipped', 'not_started'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilters({ ...filters, reflectionStatus: st })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    filters.reflectionStatus === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'all'
                    ? 'All'
                    : st === 'completed'
                    ? 'Completed'
                    : st === 'skipped'
                    ? 'Skipped'
                    : 'Not Started'}
                </button>
              ))}
            </div>
          </div>

          <button
            id="admin-clear-filters-btn"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Results Container */}
      {isLoading ? (
        <div
          id="admin-submissions-loading"
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center"
        >
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Retrieving Submissions</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Loading participant submissions and scores from the database...
          </p>
        </div>
      ) : error ? (
        <div
          id="admin-submissions-error"
          className="bg-red-950/20 border border-red-800/40 rounded-2xl p-8 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-200">Failed to Retrieve Submissions</h3>
          <p className="text-xs text-red-300/80 mt-1 max-w-sm mx-auto">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/50 hover:bg-red-900/80 text-red-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div
          id="admin-submissions-empty"
          className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center"
        >
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">
            {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {submissions.length === 0
              ? 'Share the quiz link with friends! When they complete the quiz, their submissions will appear here.'
              : 'Try clearing your search query or adjusting your filters.'}
          </p>
          {submissions.length > 0 && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table (Hidden on small mobile) */}
          <div className="hidden md:block overflow-x-auto bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Participant</th>
                  <th className="px-4 py-3.5">Mode</th>
                  <th className="px-4 py-3.5">Accuracy</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Tier</th>
                  <th className="px-4 py-3.5">Honest Room</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubmissions.map((sub) => {
                  const isAnon = sub.participantType === 'anonymous';
                  const label = isAnon ? 'Anonymous' : sub.displayName || 'Unnamed';

                  return (
                    <tr
                      key={sub.submissionId}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Participant */}
                      <td className="px-4 py-3.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span className={isAnon ? 'text-slate-400 italic' : 'text-white font-bold'}>
                            {label}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                              isAnon
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-blue-950/60 border border-blue-800/50 text-blue-300'
                            }`}
                          >
                            {isAnon ? 'Anon' : 'Named'}
                          </span>
                        </div>
                      </td>

                      {/* Mode */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          {sub.mode === 'quick' ? (
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <span>{sub.mode === 'quick' ? 'Quick (12)' : 'Full (28)'}</span>
                        </span>
                      </td>

                      {/* Accuracy */}
                      <td className="px-4 py-3.5 text-slate-300 font-mono">
                        {sub.correctCount} / {sub.totalQuestions}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5 font-bold font-['Outfit'] text-white">
                        <span className={sub.score >= 80 ? 'text-emerald-400' : sub.score >= 50 ? 'text-amber-400' : 'text-slate-300'}>
                          {sub.score}%
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {sub.tier}
                        </span>
                      </td>

                      {/* Honest Room Status */}
                      <td className="px-4 py-3.5">
                        {sub.reflectionCompletionStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-pink-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : sub.reflectionCompletionStatus === 'skipped' ? (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <XCircle className="w-3.5 h-3.5 text-slate-500" /> Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5" /> None
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {formatTimestamp(sub.submittedAt)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          id={`view-submission-btn-${sub.submissionId}`}
                          onClick={() => onSelectSubmission(sub.submissionId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-bold transition-all cursor-pointer min-h-[36px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (Strict Responsive Design for < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredSubmissions.map((sub) => {
              const isAnon = sub.participantType === 'anonymous';
              const label = isAnon ? 'Anonymous' : sub.displayName || 'Unnamed';

              return (
                <div
                  key={sub.submissionId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isAnon ? 'text-slate-400 italic' : 'text-white'}`}>
                          {label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isAnon ? 'bg-slate-800 text-slate-400' : 'bg-blue-950 text-blue-300'
                          }`}
                        >
                          {isAnon ? 'Anon' : 'Named'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {formatTimestamp(sub.submittedAt)}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold font-['Outfit'] text-white">
                        {sub.score}%
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {sub.correctCount}/{sub.totalQuestions}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-300">
                      {sub.mode === 'quick' ? '⚡ Quick Play' : '🏆 Full Challenge'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {sub.tier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px]">
                      {sub.reflectionCompletionStatus === 'completed' ? (
                        <span className="text-pink-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Honest Completed
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Honest {sub.reflectionCompletionStatus}
                        </span>
                      )}
                    </div>

                    <button
                      id={`mobile-view-submission-btn-${sub.submissionId}`}
                      onClick={() => onSelectSubmission(sub.submissionId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 text-white text-xs font-bold cursor-pointer min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
