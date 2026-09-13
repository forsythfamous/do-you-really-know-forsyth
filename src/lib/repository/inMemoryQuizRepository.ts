import {
  HonestRoomDraft,
  QuizSession,
  QuizSubmission,
  SubmissionAnalytics,
} from '../../types';
import { calculateAnalyticsFromSubmissions } from './localStorageQuizRepository';
import { QuizRepository } from './quizRepository';

/**
 * In-Memory Quiz Repository.
 *
 * Designed specifically for automated tests and development test fixtures:
 * 1. Operates 100% in memory with zero external network or database dependencies.
 * 2. Guarantees automated tests and test fixtures never call live Firestore.
 * 3. Supports full QuizRepository contract including analytics, reflections, and duplicate safety.
 */
export class InMemoryQuizRepository implements QuizRepository {
  public readonly isCloud = false;

  private activeSession: QuizSession | null = null;
  private honestDraft: HonestRoomDraft | null = null;
  private submissions: Map<string, QuizSubmission> = new Map();
  private lastSubmissionId: string | null = null;

  async saveActiveSession(session: QuizSession): Promise<void> {
    this.activeSession = { ...session };
  }

  async loadActiveSession(): Promise<QuizSession | null> {
    return this.activeSession ? { ...this.activeSession } : null;
  }

  async clearActiveSession(): Promise<void> {
    this.activeSession = null;
  }

  async saveHonestDraft(draft: HonestRoomDraft): Promise<void> {
    this.honestDraft = { ...draft };
  }

  async loadHonestDraft(): Promise<HonestRoomDraft | null> {
    return this.honestDraft ? { ...this.honestDraft } : null;
  }

  async clearHonestDraft(): Promise<void> {
    this.honestDraft = null;
  }

  async saveSubmission(submission: QuizSubmission): Promise<string> {
    const existing = this.submissions.get(submission.submissionId);

    // If already exists, preserve existing score/answers and merge reflections
    if (existing) {
      const merged: QuizSubmission = {
        ...existing,
        reflections: {
          ...existing.reflections,
          ...(submission.reflections || {}),
        },
        reflectionCompletionStatus:
          submission.reflectionCompletionStatus || existing.reflectionCompletionStatus,
      };
      this.submissions.set(submission.submissionId, merged);
    } else {
      this.submissions.set(submission.submissionId, { ...submission });
    }

    this.lastSubmissionId = submission.submissionId;
    return submission.submissionId;
  }

  async loadSubmission(id: string): Promise<QuizSubmission | null> {
    const sub = this.submissions.get(id);
    return sub ? { ...sub } : null;
  }

  async getLastSubmission(): Promise<QuizSubmission | null> {
    if (!this.lastSubmissionId) return null;
    return this.loadSubmission(this.lastSubmissionId);
  }

  async listSubmissions(): Promise<QuizSubmission[]> {
    return Array.from(this.submissions.values()).sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    });
  }

  async getSubmissionById(id: string): Promise<QuizSubmission | null> {
    return this.loadSubmission(id);
  }

  async listReflectionsForSubmission(
    submissionId: string,
  ): Promise<Record<number, string> | null> {
    const sub = this.submissions.get(submissionId);
    if (!sub?.reflections || Object.keys(sub.reflections).length === 0) {
      return null;
    }
    return { ...sub.reflections };
  }

  async deleteSubmissionWithReflections(submissionId: string): Promise<boolean> {
    const existed = this.submissions.has(submissionId);
    this.submissions.delete(submissionId);
    if (this.lastSubmissionId === submissionId) {
      this.lastSubmissionId = null;
    }
    return existed;
  }

  async getAggregateAnalytics(): Promise<SubmissionAnalytics> {
    const list = await this.listSubmissions();
    return calculateAnalyticsFromSubmissions(list);
  }

  /**
   * Clears in-memory data between unit tests.
   */
  clearAll(): void {
    this.activeSession = null;
    this.honestDraft = null;
    this.submissions.clear();
    this.lastSubmissionId = null;
  }
}
