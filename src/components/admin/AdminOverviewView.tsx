import React, { useState } from 'react';
import {
  Users,
  Award,
  Zap,
  CheckCircle2,
  HelpCircle,
  MessageSquareHeart,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { AppRoute, SubmissionAnalytics } from '../../types';
import { DEMO_SUBMISSIONS } from '../../lib/demoSubmissions';

interface AdminOverviewViewProps {
  analytics: SubmissionAnalytics;
  onNavigate: (route: AppRoute) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  analytics,
  onNavigate,
}) => {
  const [showDemoData, setShowDemoData] = useState(false);

  const hasRealSubmissions = analytics.totalSubmissions > 0;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Analytics & Overview
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white mt-1">
            Participant Submission Pulse
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time deterministic scoring, participant breakdown, and honest reflections overview.
          </p>
        </div>

        {/* Demo Data Toggle */}
        <div className="flex items-center gap-3">
          <button
            id="admin-toggle-demo-btn"
            onClick={() => setShowDemoData(!showDemoData)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[44px] ${
              showDemoData
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {showDemoData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDemoData ? 'Hide Demo Data' : 'View Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* 9 Core Metric Cards */}
      <section aria-labelledby="overview-metrics-title">
        <h3 id="overview-metrics-title" className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Core Metrics (Real Stored Submissions)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Total Submissions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.totalSubmissions}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Completed quiz sessions recorded</p>
          </div>

          {/* 2. Average Score */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.averageScore}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Mean participant accuracy across modes</p>
          </div>

          {/* 3. Quiz Completion Rate */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Quiz Completion Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {hasRealSubmissions ? `${analytics.completionRate}%` : '0%'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Submissions reaching final scored results</p>
          </div>

          {/* 4. Quick Play Submissions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Quick Play</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.quickPlayCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analytics.quickPlayCount > 0 ? `Avg score: ${analytics.quickPlayAvgScore}%` : '12-question format'}
            </p>
          </div>

          {/* 5. Full Challenge Submissions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Full Challenge</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.fullChallengeCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analytics.fullChallengeCount > 0 ? `Avg score: ${analytics.fullChallengeAvgScore}%` : '28-question comprehensive format'}
            </p>
          </div>

          {/* 6. Named Participants */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Named Submissions</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.namedCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Participants with explicit display names</p>
          </div>

          {/* 7. Anonymous Participants */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Anonymous Submissions</span>
              <UserX className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.anonymousCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Protected without names or identifiers</p>
          </div>

          {/* 8. Honest Room Completed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Honest Room Completed</span>
              <MessageSquareHeart className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.honestCompletedCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Reflections submitted to private inbox</p>
          </div>

          {/* 9. Honest Room Skipped */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Honest Room Skipped</span>
              <HelpCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-extrabold font-['Outfit'] text-white">
              {analytics.honestSkippedCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Chose "Skip & Finish" at Honest Room</p>
          </div>
        </div>
      </section>

      {/* Empty State when no real submissions */}
      {!hasRealSubmissions && (
        <section
          id="admin-overview-empty-state"
          className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-8 sm:p-12 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold font-['Outfit'] text-white">
            No Real Submissions Recorded Yet
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            As participants complete Quick Play or Full Challenge quizzes, submissions and Honest Room reflections will populate here automatically.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setShowDemoData(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Preview Demo Submissions</span>
            </button>
          </div>
        </section>
      )}

      {/* Explicit Demo Data Section (when toggled on) */}
      {showDemoData && (
        <section
          id="admin-demo-data-section"
          className="bg-amber-950/20 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-amber-500/20">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Demo Records Isolation
              </span>
              <h4 className="text-lg font-bold font-['Outfit'] text-white mt-1">
                Demonstration Submissions Preview
              </h4>
            </div>
            <p className="text-xs text-amber-200/80 max-w-md">
              Demo records are for visual illustration only. They are NEVER included in real metrics, real CSV exports, or real database deletions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_SUBMISSIONS.map((demo) => (
              <div
                key={demo.submissionId}
                className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">{demo.displayName || 'Anonymous'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                    Demo
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex justify-between">
                  <span>Score: <strong className="text-white">{demo.score}%</strong></span>
                  <span>Mode: <strong>{demo.mode === 'quick' ? 'Quick' : 'Full'}</strong></span>
                </div>
                <div className="text-xs text-slate-400">
                  Tier: <span className="text-slate-200">{demo.tier}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Honest Room: <span className="text-pink-300 capitalize">{demo.reflectionCompletionStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Navigation Cards to Sub-pages */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <button
          id="admin-goto-submissions-card"
          onClick={() => onNavigate('admin-submissions')}
          className="bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <Users className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500 group-hover:text-blue-400" />
          </div>
          <h4 className="text-base font-bold font-['Outfit'] text-white">Submissions Directory</h4>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter by tier or mode, review answers, and export real submissions CSV.
          </p>
        </button>

        <button
          id="admin-goto-reflections-card"
          onClick={() => onNavigate('admin-reflections')}
          className="bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/50 rounded-2xl p-6 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-pink-400 mb-2">
            <MessageSquareHeart className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500 group-hover:text-pink-400" />
          </div>
          <h4 className="text-base font-bold font-['Outfit'] text-white">Honest Room Inbox</h4>
          <p className="text-xs text-slate-400 mt-1">
            Confidential responses across all 10 prompts with safe plain text rendering and private export.
          </p>
        </button>

        <button
          id="admin-goto-analytics-card"
          onClick={() => onNavigate('admin-analytics')}
          className="bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500 group-hover:text-emerald-400" />
          </div>
          <h4 className="text-base font-bold font-['Outfit'] text-white">Question Analytics</h4>
          <p className="text-xs text-slate-400 mt-1">
            Question accuracy, most missed options, presentation counts, and tier distributions.
          </p>
        </button>
      </section>
    </div>
  );
};
