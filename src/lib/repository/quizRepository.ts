import { HonestRoomDraft, QuizSession, QuizSubmission, SubmissionAnalytics } from '../../types';

/**
 * Clean repository interface for quiz and reflections state persistence.
 * Decouples client UI and business rules from the underlying persistence layer (LocalStorage, Firestore, etc.).
 */
export interface QuizRepository {
  /**
   * Indicates whether this repository instance connects to cloud infrastructure.
   */
  readonly isCloud?: boolean;

  /**
   * Saves the current in-progress quiz session to allow recovery on page refresh.
   */
  saveActiveSession(session: QuizSession): Promise<void>;

  /**
   * Retrieves the current in-progress quiz session if one exists.
   */
  loadActiveSession(): Promise<QuizSession | null>;

  /**
   * Clears the active session (e.g., when the quiz is finished or restarted).
   */
  clearActiveSession(): Promise<void>;

  /**
   * Saves the current in-progress Honest Room draft.
   */
  saveHonestDraft(draft: HonestRoomDraft): Promise<void>;

  /**
   * Retrieves the current in-progress Honest Room draft if one exists.
   */
  loadHonestDraft(): Promise<HonestRoomDraft | null>;

  /**
   * Clears the in-progress Honest Room draft.
   */
  clearHonestDraft(): Promise<void>;

  /**
   * Persists a final completed quiz submission.
   * Prevents duplicate creations by keying on submissionId and safely merging updates.
   */
  saveSubmission(submission: QuizSubmission): Promise<string>;

  /**
   * Retrieves a completed submission by ID.
   */
  loadSubmission(id: string): Promise<QuizSubmission | null>;

  /**
   * Retrieves the participant's most recently completed submission for their own local result recovery.
   */
  getLastSubmission(): Promise<QuizSubmission | null>;

  /**
   * Stage 3: Lists all stored submissions for admin viewing.
   * Rejects/filters malformed records safely.
   */
  listSubmissions(): Promise<QuizSubmission[]>;

  /**
   * Stage 3: Retrieves a submission by ID with strict validation.
   */
  getSubmissionById(id: string): Promise<QuizSubmission | null>;

  /**
   * Stage 3: Retrieves reflections dictionary for a specific submission.
   */
  listReflectionsForSubmission(submissionId: string): Promise<Record<number, string> | null>;

  /**
   * Stage 3: Computes deterministic aggregate analytics from stored real submissions.
   */
  getAggregateAnalytics(): Promise<SubmissionAnalytics>;

  /**
   * Stage 3: Deletes an individual submission and its associated reflections atomically.
   */
  deleteSubmissionWithReflections(id: string): Promise<boolean>;

  /**
   * Stage 3: Optional subscription to submissions changes (e.g. for real-time reactivity).
   */
  subscribeToSubmissions?(callback: (submissions: QuizSubmission[]) => void): () => void;
}

