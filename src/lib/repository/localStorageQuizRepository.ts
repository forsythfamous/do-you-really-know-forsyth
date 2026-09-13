import { CANONICAL_QUESTIONS } from '../../data/canonicalQuestions';
import { HonestRoomDraft, QuizSession, QuizSubmission, QuestionStat, SubmissionAnalytics } from '../../types';
import { QuizRepository } from './quizRepository';

const ACTIVE_SESSION_STORAGE_KEY = 'dyrkf_active_session_v2';
const HONEST_DRAFT_STORAGE_KEY = 'dyrkf_honest_draft_v2';
const SUBMISSIONS_STORAGE_KEY = 'dyrkf_submissions_v2';
const LAST_SUBMISSION_ID_KEY = 'dyrkf_last_submission_id_v2';

export function calculateAnalyticsFromSubmissions(submissions: QuizSubmission[]): SubmissionAnalytics {
  const totalSubmissions = submissions.length;

  // Initialize per-question stats for all active canonical questions
  const activeQuestions = CANONICAL_QUESTIONS.filter((q) => q.active);
  const questionStats: Record<number, QuestionStat> = {};

  activeQuestions.forEach((q) => {
    questionStats[q.id] = {
      questionId: q.id,
      prompt: q.prompt,
      timesPresented: 0,
      timesCorrect: 0,
      accuracyPercentage: 0,
      quickPlayPresents: 0,
      fullChallengePresents: 0,
    };
  });

  if (totalSubmissions === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      quickPlayCount: 0,
      fullChallengeCount: 0,
      namedCount: 0,
      anonymousCount: 0,
      honestCompletedCount: 0,
      honestSkippedCount: 0,
      completionRate: 0,
      tierDistribution: {},
      quickPlayAvgScore: 0,
      fullChallengeAvgScore: 0,
      questionStats,
    };
  }

  let totalScoreSum = 0;
  let quickPlayCount = 0;
  let quickPlayScoreSum = 0;
  let fullChallengeCount = 0;
  let fullChallengeScoreSum = 0;
  let namedCount = 0;
  let anonymousCount = 0;
  let honestCompletedCount = 0;
  let honestSkippedCount = 0;
  const tierDistribution: Record<string, number> = {};

  // Track wrong options count per question: [questionId][optionId] -> count
  const wrongOptionsTally: Record<number, Record<string, number>> = {};

  for (const sub of submissions) {
    totalScoreSum += sub.score;

    if (sub.mode === 'quick') {
      quickPlayCount++;
      quickPlayScoreSum += sub.score;
    } else {
      fullChallengeCount++;
      fullChallengeScoreSum += sub.score;
    }

    if (sub.participantType === 'named') {
      namedCount++;
    } else {
      anonymousCount++;
    }

    if (sub.reflectionCompletionStatus === 'completed') {
      honestCompletedCount++;
    } else if (sub.reflectionCompletionStatus === 'skipped') {
      honestSkippedCount++;
    }

    const tier = sub.tier || 'Unknown';
    tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;

    // Question breakdown
    for (const qId of sub.questionIds) {
      if (!questionStats[qId]) {
        const matched = CANONICAL_QUESTIONS.find((q) => q.id === qId);
        questionStats[qId] = {
          questionId: qId,
          prompt: matched?.prompt || `Question ${qId}`,
          timesPresented: 0,
          timesCorrect: 0,
          accuracyPercentage: 0,
          quickPlayPresents: 0,
          fullChallengePresents: 0,
        };
      }

      const stat = questionStats[qId];
      stat.timesPresented++;

      if (sub.mode === 'quick') {
        stat.quickPlayPresents++;
      } else {
        stat.fullChallengePresents++;
      }

      const ans = sub.selectedAnswers[qId];
      if (ans && ans.isCorrect) {
        stat.timesCorrect++;
      } else if (ans && ans.selectedOptionId) {
        if (!wrongOptionsTally[qId]) wrongOptionsTally[qId] = {};
        wrongOptionsTally[qId][ans.selectedOptionId] =
          (wrongOptionsTally[qId][ans.selectedOptionId] || 0) + 1;
      }
    }
  }

  // Compute accuracy percentages and find most common wrong options
  let highestAccuracy = -1;
  let lowestAccuracy = 101;
  let mostCorrectQuestionId: number | undefined;
  let mostMissedQuestionId: number | undefined;

  Object.values(questionStats).forEach((stat) => {
    if (stat.timesPresented > 0) {
      stat.accuracyPercentage = Math.round((stat.timesCorrect / stat.timesPresented) * 100);

      if (stat.accuracyPercentage > highestAccuracy) {
        highestAccuracy = stat.accuracyPercentage;
        mostCorrectQuestionId = stat.questionId;
      }
      if (stat.accuracyPercentage < lowestAccuracy) {
        lowestAccuracy = stat.accuracyPercentage;
        mostMissedQuestionId = stat.questionId;
      }

      // Check most common wrong option
      const wrongTally = wrongOptionsTally[stat.questionId];
      if (wrongTally) {
        let maxWrongCount = 0;
        let worstOptionId: string | undefined;
        for (const [optId, cnt] of Object.entries(wrongTally)) {
          if (cnt > maxWrongCount) {
            maxWrongCount = cnt;
            worstOptionId = optId;
          }
        }
        if (worstOptionId) {
          stat.mostCommonWrongOptionId = worstOptionId;
          const qDef = CANONICAL_QUESTIONS.find((q) => q.id === stat.questionId);
          const optDef = qDef?.options.find((o) => o.id === worstOptionId);
          stat.mostCommonWrongOptionLabel = optDef?.label || worstOptionId;
        }
      }
    }
  });

  return {
    totalSubmissions,
    averageScore: Math.round(totalScoreSum / totalSubmissions),
    quickPlayCount,
    fullChallengeCount,
    namedCount,
    anonymousCount,
    honestCompletedCount,
    honestSkippedCount,
    completionRate: 100, // all stored submissions are completed quizzes
    tierDistribution,
    quickPlayAvgScore:
      quickPlayCount > 0 ? Math.round(quickPlayScoreSum / quickPlayCount) : 0,
    fullChallengeAvgScore:
      fullChallengeCount > 0 ? Math.round(fullChallengeScoreSum / fullChallengeCount) : 0,
    mostCorrectQuestionId,
    mostMissedQuestionId,
    questionStats,
  };
}

export class LocalStorageQuizRepository implements QuizRepository {
  // -------------------------------------------------------------
  // ACTIVE QUIZ SESSION
  // -------------------------------------------------------------
  async saveActiveSession(session: QuizSession): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const serialized = JSON.stringify(session);
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, serialized);
    } catch (err) {
      console.warn('LocalStorage saveActiveSession failed:', err);
    }
  }

  async loadActiveSession(): Promise<QuizSession | null> {
    try {
      if (typeof window === 'undefined') return null;
      const data = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as QuizSession;

      // Strict runtime structural validation
      const hasValidStructure =
        parsed &&
        typeof parsed.sessionId === 'string' &&
        parsed.participant &&
        (parsed.participant.type === 'named' || parsed.participant.type === 'anonymous') &&
        (parsed.mode === 'quick' || parsed.mode === 'full') &&
        Array.isArray(parsed.shuffledQuestions) &&
        parsed.shuffledQuestions.length > 0 &&
        typeof parsed.currentQuestionIndex === 'number' &&
        parsed.currentQuestionIndex >= 0 &&
        parsed.currentQuestionIndex <= parsed.shuffledQuestions.length &&
        parsed.answers &&
        typeof parsed.answers === 'object';

      if (hasValidStructure) {
        return parsed;
      }

      // Purge malformed/corrupted data safely
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    } catch (err) {
      console.warn('LocalStorage loadActiveSession failed to parse:', err);
      return null;
    }
  }

  async clearActiveSession(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('LocalStorage clearActiveSession failed:', err);
    }
  }

  // -------------------------------------------------------------
  // HONEST ROOM DRAFT
  // -------------------------------------------------------------
  async saveHonestDraft(draft: HonestRoomDraft): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const serialized = JSON.stringify(draft);
      window.localStorage.setItem(HONEST_DRAFT_STORAGE_KEY, serialized);
    } catch (err) {
      console.warn('LocalStorage saveHonestDraft failed:', err);
    }
  }

  async loadHonestDraft(): Promise<HonestRoomDraft | null> {
    try {
      if (typeof window === 'undefined') return null;
      const data = window.localStorage.getItem(HONEST_DRAFT_STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as HonestRoomDraft;

      // Strict runtime validation for draft
      const hasValidStructure =
        parsed &&
        typeof parsed.submissionId === 'string' &&
        parsed.participant &&
        (parsed.participant.type === 'named' || parsed.participant.type === 'anonymous') &&
        (parsed.mode === 'quick' || parsed.mode === 'full') &&
        parsed.reflections &&
        typeof parsed.reflections === 'object' &&
        typeof parsed.currentQuestionIndex === 'number' &&
        parsed.currentQuestionIndex >= 0 &&
        parsed.currentQuestionIndex <= 10;

      if (hasValidStructure) {
        return parsed;
      }

      window.localStorage.removeItem(HONEST_DRAFT_STORAGE_KEY);
      return null;
    } catch (err) {
      console.warn('LocalStorage loadHonestDraft failed to parse:', err);
      return null;
    }
  }

  async clearHonestDraft(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(HONEST_DRAFT_STORAGE_KEY);
    } catch (err) {
      console.warn('LocalStorage clearHonestDraft failed:', err);
    }
  }

  // -------------------------------------------------------------
  // SUBMISSIONS PERSISTENCE & DUPLICATE PROTECTION
  // -------------------------------------------------------------
  async saveSubmission(submission: QuizSubmission): Promise<string> {
    try {
      if (typeof window === 'undefined') return submission.submissionId;

      // Strict integrity guard: No reflection-only or synthetic submissions allowed
      if (submission.mode !== 'quick' && submission.mode !== 'full') {
        throw new Error(`Invalid submission mode: "${submission.mode}". Must be "quick" or "full".`);
      }
      if (typeof submission.score !== 'number' || isNaN(submission.score)) {
        throw new Error('Invalid submission: quiz must be completed with a numeric score.');
      }
      if (typeof submission.correctCount !== 'number' || typeof submission.totalQuestions !== 'number') {
        throw new Error('Invalid submission: missing valid question counts.');
      }

      // Ensure anonymous submissions strictly have displayName: null
      const sanitized: QuizSubmission = {
        ...submission,
        displayName:
          submission.participantType === 'anonymous' ? null : submission.displayName,
        reflectionCompletionStatus: submission.reflectionCompletionStatus || 'not_started',
        schemaVersion: submission.schemaVersion || 2,
      };

      const existingRaw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      const submissions: Record<string, QuizSubmission> = existingRaw
        ? JSON.parse(existingRaw)
        : {};

      // If existing submission with this ID already exists, merge cleanly without duplicates
      const existing = submissions[sanitized.submissionId];
      if (existing) {
        submissions[sanitized.submissionId] = {
          ...existing,
          // Guarantee completed quiz metrics are strictly preserved and never mutated
          mode: existing.mode,
          questionIds: existing.questionIds,
          selectedAnswers: existing.selectedAnswers,
          correctCount: existing.correctCount,
          totalQuestions: existing.totalQuestions,
          score: existing.score,
          tier: existing.tier,
          quizCompletedAt: existing.quizCompletedAt || sanitized.quizCompletedAt,
          // Merge reflections and update reflection completion status
          reflections: {
            ...(existing.reflections || {}),
            ...(sanitized.reflections || {}),
          },
          reflectionCompletionStatus:
            sanitized.reflectionCompletionStatus || existing.reflectionCompletionStatus,
          submittedAt: sanitized.submittedAt,
          schemaVersion: sanitized.schemaVersion || existing.schemaVersion || 2,
        };
      } else {
        submissions[sanitized.submissionId] = sanitized;
      }

      window.localStorage.setItem(
        SUBMISSIONS_STORAGE_KEY,
        JSON.stringify(submissions),
      );
      window.localStorage.setItem(LAST_SUBMISSION_ID_KEY, sanitized.submissionId);

      return sanitized.submissionId;
    } catch (err) {
      console.warn('LocalStorage saveSubmission failed:', err);
      throw err;
    }
  }

  async loadSubmission(id: string): Promise<QuizSubmission | null> {
    try {
      if (typeof window === 'undefined') return null;
      const existingRaw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (!existingRaw) return null;
      const submissions: Record<string, QuizSubmission> = JSON.parse(existingRaw);
      return submissions[id] || null;
    } catch (err) {
      console.warn('LocalStorage loadSubmission failed:', err);
      return null;
    }
  }

  async getLastSubmission(): Promise<QuizSubmission | null> {
    try {
      if (typeof window === 'undefined') return null;
      const lastId = window.localStorage.getItem(LAST_SUBMISSION_ID_KEY);
      if (lastId) {
        const found = await this.loadSubmission(lastId);
        if (found) return found;
      }
      return null;
    } catch (err) {
      console.warn('LocalStorage getLastSubmission failed:', err);
      return null;
    }
  }

  // -------------------------------------------------------------
  // STAGE 3 ADMIN REPOSITORY METHODS
  // -------------------------------------------------------------
  private listeners: Set<(submissions: QuizSubmission[]) => void> = new Set();

  async listSubmissions(): Promise<QuizSubmission[]> {
    try {
      if (typeof window === 'undefined') return [];
      const raw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (!raw) return [];

      let parsed: Record<string, any>;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.warn('Malformed submissions JSON in storage:', e);
        return [];
      }

      if (typeof parsed !== 'object' || parsed === null) return [];

      const validList: QuizSubmission[] = [];

      for (const [id, item] of Object.entries(parsed)) {
        if (!item || typeof item !== 'object') continue;

        // Strict schema validation to reject malformed records
        const isValid =
          typeof item.submissionId === 'string' &&
          item.submissionId.length > 0 &&
          (item.mode === 'quick' || item.mode === 'full') &&
          (item.participantType === 'named' || item.participantType === 'anonymous') &&
          typeof item.score === 'number' &&
          !isNaN(item.score) &&
          typeof item.correctCount === 'number' &&
          typeof item.totalQuestions === 'number';

        if (!isValid) {
          console.warn(`Skipping malformed submission record with key: ${id}`);
          continue;
        }

        const sanitized: QuizSubmission = {
          submissionId: item.submissionId,
          participantType: item.participantType,
          displayName: item.participantType === 'anonymous' ? null : (item.displayName || 'Unnamed'),
          mode: item.mode,
          questionIds: Array.isArray(item.questionIds) ? item.questionIds : [],
          selectedAnswers: item.selectedAnswers && typeof item.selectedAnswers === 'object' ? item.selectedAnswers : {},
          correctCount: item.correctCount,
          totalQuestions: item.totalQuestions,
          score: item.score,
          tier: typeof item.tier === 'string' ? item.tier : 'Result Tier',
          reflections: item.reflections && typeof item.reflections === 'object' ? item.reflections : {},
          reflectionCompletionStatus:
            item.reflectionCompletionStatus === 'completed' ||
            item.reflectionCompletionStatus === 'skipped'
              ? item.reflectionCompletionStatus
              : 'not_started',
          quizCompletedAt: item.quizCompletedAt || item.submittedAt || new Date().toISOString(),
          submittedAt: item.submittedAt || new Date().toISOString(),
          schemaVersion: item.schemaVersion || 2,
        };

        validList.push(sanitized);
      }

      // Sort newest first by default
      return validList.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
    } catch (err) {
      console.warn('LocalStorage listSubmissions error:', err);
      return [];
    }
  }

  async getSubmissionById(id: string): Promise<QuizSubmission | null> {
    const all = await this.listSubmissions();
    return all.find((s) => s.submissionId === id) || null;
  }

  async listReflectionsForSubmission(submissionId: string): Promise<Record<number, string> | null> {
    const submission = await this.getSubmissionById(submissionId);
    return submission?.reflections || null;
  }

  async deleteSubmissionWithReflections(id: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const raw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (!raw) return false;

      const submissions: Record<string, QuizSubmission> = JSON.parse(raw);
      if (!submissions[id]) {
        return false;
      }

      delete submissions[id];
      window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));

      // Clear last submission pointer if matching
      const lastId = window.localStorage.getItem(LAST_SUBMISSION_ID_KEY);
      if (lastId === id) {
        window.localStorage.removeItem(LAST_SUBMISSION_ID_KEY);
      }

      // Notify listeners
      const updatedList = await this.listSubmissions();
      this.listeners.forEach((fn) => {
        try {
          fn(updatedList);
        } catch {
          // ignore listener errors
        }
      });

      return true;
    } catch (err) {
      console.warn('LocalStorage deleteSubmissionWithReflections failed:', err);
      return false;
    }
  }

  async getAggregateAnalytics(): Promise<SubmissionAnalytics> {
    const submissions = await this.listSubmissions();
    return calculateAnalyticsFromSubmissions(submissions);
  }

  subscribeToSubmissions(callback: (submissions: QuizSubmission[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}
