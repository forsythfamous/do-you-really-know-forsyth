import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import { SubmissionAnalytics } from '../../types';
import { CANONICAL_QUESTIONS } from '../../data/canonicalQuestions';

interface AdminAnalyticsViewProps {
  analytics: SubmissionAnalytics;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ analytics }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const hasSubmissions = analytics.totalSubmissions > 0;

  // Canonical questions list
  const questionsList = CANONICAL_QUESTIONS.filter((q) => q.active);

  const filteredQuestions = questionsList.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      q.prompt.toLowerCase().includes(query) ||
      q.category.toLowerCase().includes(query) ||
      String(q.id).includes(query)
    );
  });

  const mostCorrect = analytics.mostCorrectQuestionId
    ? CANONICAL_QUESTIONS.find((q) => q.id === analytics.mostCorrectQuestionId)
    : null;

  const mostMissed = analytics.mostMissedQuestionId
    ? CANONICAL_QUESTIONS.find((q) => q.id === analytics.mostMissedQuestionId)
    : null;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
          Deterministic Intelligence
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white mt-1">
          Question Accuracy & Analytics
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Deterministic performance metrics computed directly from {analytics.totalSubmissions} stored submissions. All figures reflect actual participant answers.
        </p>
      </div>

      {/* Highlights & Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Correctly Answered Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span>Highest Accuracy Question</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          {mostCorrect && analytics.questionStats[mostCorrect.id] ? (
            <div>
              <div className="text-2xl font-extrabold font-['Outfit'] text-white">
                {analytics.questionStats[mostCorrect.id].accuracyPercentage}% correct
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-1 line-clamp-2">
                #{mostCorrect.id}: {mostCorrect.prompt}
              </p>
              <span className="text-[11px] text-slate-500 block mt-2">
                Presented {analytics.questionStats[mostCorrect.id].timesPresented} times ({analytics.questionStats[mostCorrect.id].timesCorrect} correct)
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No presentation data recorded yet.</p>
          )}
        </div>

        {/* Most Frequently Missed Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-400">
            <span>Most Challenging Question</span>
            <XCircle className="w-4 h-4" />
          </div>
          {mostMissed && analytics.questionStats[mostMissed.id] ? (
            <div>
              <div className="text-2xl font-extrabold font-['Outfit'] text-white">
                {analytics.questionStats[mostMissed.id].accuracyPercentage}% correct
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-1 line-clamp-2">
                #{mostMissed.id}: {mostMissed.prompt}
              </p>
              <span className="text-[11px] text-slate-500 block mt-2">
                {analytics.questionStats[mostMissed.id].mostCommonWrongOptionLabel
                  ? `Most common trap: "${analytics.questionStats[mostMissed.id].mostCommonWrongOptionLabel}"`
                  : `Missed in ${analytics.questionStats[mostMissed.id].timesPresented - analytics.questionStats[mostMissed.id].timesCorrect} presentations`}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No presentation data recorded yet.</p>
          )}
        </div>

        {/* Mode Comparison Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-400">
            <span>Mode Performance</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Quick Play
              </span>
              <span className="text-xl font-extrabold font-['Outfit'] text-white block mt-0.5">
                {analytics.quickPlayAvgScore}%
              </span>
              <span className="text-[10px] text-slate-500">{analytics.quickPlayCount} submissions</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Full Challenge
              </span>
              <span className="text-xl font-extrabold font-['Outfit'] text-white block mt-0.5">
                {analytics.fullChallengeAvgScore}%
              </span>
              <span className="text-[10px] text-slate-500">{analytics.fullChallengeCount} submissions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Distribution Breakdown */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-['Outfit'] text-white">
              Result Tier Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of participant relationship tiers based on quiz score cutoffs
            </p>
          </div>
          <Award className="w-5 h-5 text-amber-400" />
        </div>

        {Object.keys(analytics.tierDistribution).length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No submissions recorded yet. Tier distributions will appear once quizzes are completed.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            {Object.entries(analytics.tierDistribution).map(([tier, countValue]) => {
              const count = Number(countValue) || 0;
              const pct = analytics.totalSubmissions > 0
                ? Math.round((count / analytics.totalSubmissions) * 100)
                : 0;

              return (
                <div key={tier} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{tier}</span>
                    <span className="text-slate-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Canonical Question Breakdown Table */}
      <section className="space-y-4" aria-labelledby="all-questions-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 id="all-questions-title" className="text-lg font-bold font-['Outfit'] text-white">
              Question Accuracy Breakdown ({filteredQuestions.length} of {questionsList.length})
            </h3>
            <p className="text-xs text-slate-400">
              Presentation frequency, correct responses, and most common wrong choices
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="admin-analytics-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by text or ID..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 min-h-[40px]"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5 w-14">#</th>
                <th className="px-4 py-3.5">Question Prompt</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Presents</th>
                <th className="px-4 py-3.5">Accuracy</th>
                <th className="px-4 py-3.5">Mode Split (Q / F)</th>
                <th className="px-4 py-3.5">Most Common Missed Option</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuestions.map((q) => {
                const stat = analytics.questionStats[q.id];
                const presents = stat?.timesPresented || 0;
                const correct = stat?.timesCorrect || 0;
                const accuracy = stat?.accuracyPercentage || 0;

                return (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-500 font-bold">
                      {q.id}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-200 max-w-sm">
                      <span className="line-clamp-2">{q.prompt}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                        {q.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {presents}
                    </td>
                    <td className="px-4 py-3.5">
                      {presents > 0 ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-['Outfit'] text-sm ${
                              accuracy >= 80
                                ? 'text-emerald-400'
                                : accuracy >= 50
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {accuracy}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({correct}/{presents})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {stat ? `${stat.quickPlayPresents} / ${stat.fullChallengePresents}` : '0 / 0'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-xs text-[11px]">
                      {stat?.mostCommonWrongOptionLabel ? (
                        <span className="text-red-300/90 font-medium">
                          "{stat.mostCommonWrongOptionLabel}"
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">None recorded</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
