import { HonestRoomDraft, QuizSession, QuizSubmission, SubmissionAnalytics } from '../../types';
import { QuizRepository } from './quizRepository';

/**
 * Firestore adapter boundary skeleton for Stage 2 & 3.
 *
 * This boundary defines how the application will communicate with Cloud Firestore
 * once real Firebase credentials/environment values are supplied.
 *
 * Firestore Collections specified in section 6 of the product spec:
 * - questions/{id}: type, prompt, options[{id,label}], correctOptionId, category, active, order
 * - submissions/{id}: submissionId, participantType, displayName|null, mode, questionIds, selectedAnswers, correctCount, totalQuestions, score, tier, reflections, quizCompletedAt, submittedAt, schemaVersion
 * - settings/public: title, acceptingResponses, quickPlayCount, honestRoomEnabled
 *
 * Note: Firebase is intentionally unconfigured until real environment variables are provided.
 * This class preserves the architectural boundary without inventing false credentials.
 */
export class FirestoreQuizRepositoryStub implements QuizRepository {
  private isConfigured = false;

  constructor() {
    // In future stages, initialize Firebase Firestore client here using environment variables
    this.isConfigured = false;
  }

  async saveActiveSession(_session: QuizSession): Promise<void> {
    if (!this.isConfigured) {
      // Local session state remains local until remote sync is configured
      return;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async loadActiveSession(): Promise<QuizSession | null> {
    if (!this.isConfigured) {
      return null;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async clearActiveSession(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async saveHonestDraft(_draft: HonestRoomDraft): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async loadHonestDraft(): Promise<HonestRoomDraft | null> {
    if (!this.isConfigured) {
      return null;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async clearHonestDraft(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async saveSubmission(_submission: QuizSubmission): Promise<string> {
    if (!this.isConfigured) {
      console.info(
        '[FirestoreBoundary] Submission saved locally. Remote Firestore adapter remains unconfigured until credentials are provided.',
      );
      return _submission.submissionId;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async loadSubmission(_id: string): Promise<QuizSubmission | null> {
    if (!this.isConfigured) {
      return null;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async getLastSubmission(): Promise<QuizSubmission | null> {
    if (!this.isConfigured) {
      return null;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async listSubmissions(): Promise<QuizSubmission[]> {
    if (!this.isConfigured) {
      return [];
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async getSubmissionById(_id: string): Promise<QuizSubmission | null> {
    if (!this.isConfigured) {
      return null;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async listReflectionsForSubmission(_submissionId: string): Promise<Record<number, string> | null> {
    if (!this.isConfigured) {
      return null;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async deleteSubmissionWithReflections(_id: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }

  async getAggregateAnalytics(): Promise<SubmissionAnalytics> {
    if (!this.isConfigured) {
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
        questionStats: {},
      };
    }
    throw new Error('Firestore adapter unconfigured: waiting for real Firebase environment credentials.');
  }
}
