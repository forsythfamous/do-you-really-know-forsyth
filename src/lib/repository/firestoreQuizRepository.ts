import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  HonestRoomDraft,
  QuizSession,
  QuizSubmission,
  SubmissionAnalytics,
} from '../../types';
import {
  ensureAnonymousParticipant,
  getFirebaseFirestore,
  getFirebaseAuth,
  isTestEnvironment,
} from '../firebase';
import {
  calculateAnalyticsFromSubmissions,
  LocalStorageQuizRepository,
} from './localStorageQuizRepository';
import { QuizRepository } from './quizRepository';

/**
 * Checks if a submission is a demo record.
 * Demo records must never be persisted to Firestore.
 */
export function isDemoSubmission(submission: Partial<QuizSubmission>): boolean {
  return Boolean(
    (submission as any)?.isDemo === true ||
    submission.submissionId?.startsWith('demo-') ||
    submission.displayName?.includes('[DEMO]')
  );
}

/**
 * Checks if a submission is a test fixture or test-generated payload.
 * Test fixtures must never call the live FirestoreQuizRepository.
 */
export function isTestSubmission(submission: Partial<QuizSubmission>): boolean {
  return Boolean(
    (submission as any)?.isTest === true ||
    submission.submissionId?.startsWith('test-') ||
    submission.submissionId?.startsWith('fixture-') ||
    submission.submissionId?.startsWith('mock-') ||
    submission.displayName?.includes('[TEST]') ||
    submission.ownerUid?.startsWith('test-')
  );
}

function removeUndefinedValues<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedValues(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (val !== undefined) {
      result[key] = removeUndefinedValues(val);
    }
  }
  return result as T;
}

/**
 * Production Cloud Firestore Quiz Repository.
 *
 * Implements the full persistence contract for "Do You Really Know Forsyth?":
 * - Completed submissions stored under `submissions/{submissionId}`.
 * - Honest Room reflections stored under `submissions/{submissionId}/reflections/{reflectionId}`.
 * - In-progress sessions and drafts maintained locally for instant refresh recovery.
 * - In-flight deduplication and stable submission ID reuse prevent duplicate creations.
 * - Scores, tiers, and answers are deterministically preserved and never recalculated.
 */
export class FirestoreQuizRepository implements QuizRepository {
  public readonly isCloud = true;
  private localRepo: LocalStorageQuizRepository;
  private inFlightSaves: Map<string, Promise<string>> = new Map();

  constructor() {
    this.localRepo = new LocalStorageQuizRepository();
  }

  // -------------------------------------------------------------
  // IN-PROGRESS SESSIONS (Preserved locally for refresh recovery)
  // -------------------------------------------------------------
  async saveActiveSession(session: QuizSession): Promise<void> {
    return this.localRepo.saveActiveSession(session);
  }

  async loadActiveSession(): Promise<QuizSession | null> {
    return this.localRepo.loadActiveSession();
  }

  async clearActiveSession(): Promise<void> {
    return this.localRepo.clearActiveSession();
  }

  async saveHonestDraft(draft: HonestRoomDraft): Promise<void> {
    return this.localRepo.saveHonestDraft(draft);
  }

  async loadHonestDraft(): Promise<HonestRoomDraft | null> {
    return this.localRepo.loadHonestDraft();
  }

  async clearHonestDraft(): Promise<void> {
    return this.localRepo.clearHonestDraft();
  }

  // -------------------------------------------------------------
  // SUBMISSIONS PERSISTENCE & DUPLICATE PROTECTION
  // -------------------------------------------------------------
  async saveSubmission(submission: QuizSubmission): Promise<string> {
    // 1. Strict validation
    if (submission.mode !== 'quick' && submission.mode !== 'full') {
      throw new Error(`Invalid submission mode: "${submission.mode}". Must be "quick" or "full".`);
    }
    if (typeof submission.score !== 'number' || isNaN(submission.score)) {
      throw new Error('Invalid submission: quiz must be completed with a numeric score.');
    }
    if (typeof submission.correctCount !== 'number' || typeof submission.totalQuestions !== 'number') {
      throw new Error('Invalid submission: missing valid question counts.');
    }

    // Requirement 3: Demo submissions must never be persisted to Firestore
    if (isDemoSubmission(submission)) {
      console.info(
        `[FirestoreQuizRepository] Demo submission ${submission.submissionId} bypassed live Firestore persistence.`
      );
      await this.localRepo.saveSubmission(submission);
      return submission.submissionId;
    }

    // Requirement 2: Test fixtures must never call the live FirestoreQuizRepository
    // Requirement 4: Production Firestore activation must not occur inside npm test
    if (isTestSubmission(submission) || isTestEnvironment()) {
      throw new Error(
        `[Security Guard] Test fixture or automated test execution detected. Live FirestoreQuizRepository must never be called by tests or fixtures. (submissionId: ${submission.submissionId})`
      );
    }

    // In-flight deduplication: prevent concurrent duplicate triggers
    if (this.inFlightSaves.has(submission.submissionId)) {
      return this.inFlightSaves.get(submission.submissionId)!;
    }

    const savePromise = (async () => {
      try {
        const firestore = getFirebaseFirestore();
        if (!firestore) {
          throw new Error('Firestore is not configured. Real Firebase credentials are required.');
        }

        // 2. Ensure anonymous participant authentication completed before write
        let ownerUid = submission.ownerUid;
        try {
          const authUid = await ensureAnonymousParticipant();
          if (authUid) {
            ownerUid = authUid;
          }
        } catch (err) {
          console.warn('[FirestoreQuizRepository] Auth initialization note:', (err as Error).message);
        }

        const auth = getFirebaseAuth();
        if (!ownerUid || ownerUid === 'anonymous-participant' || ownerUid === 'anonymous') {
          if (auth?.currentUser?.uid) {
            ownerUid = auth.currentUser.uid;
          }
        }

        // 3. Document reference (stable ID)
        const subDocRef = doc(firestore, 'submissions', submission.submissionId);

        // 4. Update local cache immediately so participant state is never lost even if cloud write fails
        await this.localRepo.saveSubmission({
          ...submission,
          ownerUid: ownerUid || 'anonymous-participant',
        });

        // 5. Check if doc already exists to preserve initial scores and timestamps
        // First check local repository; if not present, safely attempt getDoc with catch.
        let existing: Record<string, unknown> | null = null;
        try {
          const localExisting = await this.localRepo.loadSubmission(submission.submissionId);
          if (localExisting && typeof localExisting.score === 'number') {
            existing = localExisting as unknown as Record<string, unknown>;
          } else {
            const existingSnap = await getDoc(subDocRef);
            existing = existingSnap.exists() ? (existingSnap.data() as Record<string, unknown>) : null;
          }
        } catch {
          // Document does not exist yet or client permissions prevent reading non-existent doc
          existing = null;
        }

        // Requirements 4, 5, 6, 7: Conform strictly to Firestore security rules
        const validParticipantType: 'named' | 'anonymous' =
          submission.participantType === 'named' ? 'named' : 'anonymous';

        // Requirement 7: Confirm anonymous participants store displayName as null
        const validDisplayName =
          validParticipantType === 'anonymous'
            ? null
            : (typeof submission.displayName === 'string' && submission.displayName.trim().length > 0
                ? submission.displayName.trim()
                : null);

        // Requirement 6: Confirm mode is exactly 'quick' or 'full'
        const validMode: 'quick' | 'full' =
          submission.mode === 'full' ? 'full' : 'quick';

        // Requirement 5: Confirm ownerUid matches request.auth.uid if authenticated
        const finalOwnerUid = ownerUid || auth?.currentUser?.uid || 'anonymous-participant';

        // Requirement 4: Deep sanitize selectedAnswers to remove undefined values
        const sanitizedAnswers: Record<string, unknown> = {};
        const sourceAnswers = (existing?.selectedAnswers as Record<string, unknown>) || submission.selectedAnswers || {};
        for (const [k, v] of Object.entries(sourceAnswers)) {
          if (v && typeof v === 'object') {
            const r = v as Record<string, unknown>;
            sanitizedAnswers[k] = {
              questionId: typeof r.questionId === 'number' ? r.questionId : Number(k),
              selectedOptionId: typeof r.selectedOptionId === 'string' ? r.selectedOptionId : '',
              selectedOptionLabel: typeof r.selectedOptionLabel === 'string' ? r.selectedOptionLabel : '',
              isCorrect: Boolean(r.isCorrect),
              correctOptionId: typeof r.correctOptionId === 'string' ? r.correctOptionId : '',
              correctAnswerText: typeof r.correctAnswerText === 'string' ? r.correctAnswerText : '',
              timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now(),
            };
          }
        }

        const nowIso = new Date().toISOString();
        const startedAt = String(existing?.startedAt || submission.startedAt || submission.quizCompletedAt || nowIso);
        const completedAt = String(existing?.completedAt || submission.completedAt || submission.quizCompletedAt || nowIso);
        const quizCompletedAt = String(existing?.quizCompletedAt || submission.quizCompletedAt || nowIso);
        const submittedAt = String(submission.submittedAt || existing?.submittedAt || nowIso);

        const rawDocData = {
          submissionId: String(submission.submissionId),
          ownerUid: String(finalOwnerUid),
          participantType: validParticipantType,
          displayName: validDisplayName,
          mode: validMode,
          questionIds: Array.isArray(existing?.questionIds)
            ? existing.questionIds
            : (Array.isArray(submission.questionIds) ? submission.questionIds : []),
          selectedAnswers: sanitizedAnswers,
          correctCount: typeof existing?.correctCount === 'number'
            ? existing.correctCount
            : (typeof submission.correctCount === 'number' ? submission.correctCount : 0),
          totalQuestions: typeof existing?.totalQuestions === 'number'
            ? existing.totalQuestions
            : (typeof submission.totalQuestions === 'number' ? submission.totalQuestions : 12),
          score: typeof existing?.score === 'number'
            ? existing.score
            : (typeof submission.score === 'number' ? submission.score : 0),
          tier: String(existing?.tier || submission.tier || 'Inner-Circle Material'),
          startedAt,
          completedAt,
          reflectionCompletionStatus: submission.reflectionCompletionStatus || (existing?.reflectionCompletionStatus as any) || 'not_started',
          quizCompletedAt,
          submittedAt,
          createdAt: existing?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          schemaVersion: 2,
        };

        // Remove any undefined values completely
        const docData = removeUndefinedValues(rawDocData);

        try {
          await setDoc(subDocRef, docData, { merge: true });

          // 6. Save reflections in subcollection `submissions/{submissionId}/reflections/{reflectionId}`
          if (submission.reflections && Object.keys(submission.reflections).length > 0) {
            for (const [qIdStr, reflectionText] of Object.entries(submission.reflections)) {
              const qId = Number(qIdStr);
              const text = (reflectionText || '').trim();
              const reflectionRef = doc(
                firestore,
                'submissions',
                submission.submissionId,
                'reflections',
                String(qId),
              );

              await setDoc(
                reflectionRef,
                removeUndefinedValues({
                  ownerUid: String(finalOwnerUid),
                  questionId: qId,
                  response: text,
                  skipped: text.length === 0,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                }),
                { merge: true },
              );
            }
          }
        } catch (cloudErr) {
          console.error('[FirestoreQuizRepository] setDoc write failed:', cloudErr);
          throw cloudErr;
        }

        return submission.submissionId;
      } finally {
        this.inFlightSaves.delete(submission.submissionId);
      }
    })();

    this.inFlightSaves.set(submission.submissionId, savePromise);
    return savePromise;
  }

  async loadSubmission(id: string): Promise<QuizSubmission | null> {
    try {
      const firestore = getFirebaseFirestore();
      if (!firestore) return this.localRepo.loadSubmission(id);

      await ensureAnonymousParticipant().catch(() => null);

      const subDocRef = doc(firestore, 'submissions', id);
      const snap = await getDoc(subDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          submissionId: snap.id,
          ownerUid: data.ownerUid,
          participantType: data.participantType,
          displayName: data.participantType === 'anonymous' ? null : data.displayName,
          mode: data.mode,
          questionIds: data.questionIds || [],
          selectedAnswers: data.selectedAnswers || {},
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          score: data.score,
          tier: data.tier,
          reflectionCompletionStatus: data.reflectionCompletionStatus || 'not_started',
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          createdAt: data.createdAt,
          quizCompletedAt: data.quizCompletedAt || data.completedAt || '',
          submittedAt: data.submittedAt || data.completedAt || '',
          schemaVersion: data.schemaVersion || 2,
        };
      }
      return this.localRepo.loadSubmission(id);
    } catch {
      return this.localRepo.loadSubmission(id);
    }
  }

  async getLastSubmission(): Promise<QuizSubmission | null> {
    return this.localRepo.getLastSubmission();
  }

  // -------------------------------------------------------------
  // ADMIN DASHBOARD QUERIES & CASCASED DELETION
  // -------------------------------------------------------------
  async listSubmissions(): Promise<QuizSubmission[]> {
    if (isTestEnvironment()) {
      throw new Error(
        '[Security Guard] Live FirestoreQuizRepository.listSubmissions cannot be called in test environments. Tests must use mocked or in-memory repositories.'
      );
    }

    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore is not configured.');
    }

    const subsCol = collection(firestore, 'submissions');
    const snap = await getDocs(subsCol);
    const list: QuizSubmission[] = [];

    snap.forEach((d) => {
      const data = d.data();
      if (data && typeof data.score === 'number') {
        list.push({
          submissionId: d.id,
          ownerUid: data.ownerUid,
          participantType: data.participantType,
          displayName: data.participantType === 'anonymous' ? null : data.displayName,
          mode: data.mode,
          questionIds: data.questionIds || [],
          selectedAnswers: data.selectedAnswers || {},
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          score: data.score,
          tier: data.tier,
          reflectionCompletionStatus: data.reflectionCompletionStatus || 'not_started',
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          createdAt: data.createdAt,
          quizCompletedAt: data.quizCompletedAt || data.completedAt || '',
          submittedAt: data.submittedAt || data.completedAt || '',
          schemaVersion: data.schemaVersion || 2,
        });
      }
    });

    // Sort descending by submittedAt
    list.sort((a, b) => {
      const timeA = new Date(a.submittedAt || a.quizCompletedAt).getTime();
      const timeB = new Date(b.submittedAt || b.quizCompletedAt).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });

    return list;
  }

  async getSubmissionById(id: string): Promise<QuizSubmission | null> {
    const submission = await this.loadSubmission(id);
    if (!submission) return null;

    // Load reflections from subcollection
    const reflections = await this.listReflectionsForSubmission(id);
    if (reflections) {
      submission.reflections = reflections;
    }
    return submission;
  }

  async listReflectionsForSubmission(submissionId: string): Promise<Record<number, string> | null> {
    const firestore = getFirebaseFirestore();
    if (!firestore) return null;

    try {
      await ensureAnonymousParticipant().catch(() => null);
      const refCol = collection(firestore, 'submissions', submissionId, 'reflections');
      const snap = await getDocs(refCol);
      if (snap.empty) return null;

      const reflections: Record<number, string> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.questionId !== undefined && typeof data.response === 'string') {
          reflections[data.questionId] = data.response;
        }
      });
      return Object.keys(reflections).length > 0 ? reflections : null;
    } catch {
      return null;
    }
  }

  async deleteSubmissionWithReflections(id: string): Promise<boolean> {
    if (isTestEnvironment()) {
      throw new Error(
        '[Security Guard] Live FirestoreQuizRepository.deleteSubmissionWithReflections cannot be called in test environments.'
      );
    }

    const firestore = getFirebaseFirestore();
    if (!firestore) return false;

    try {
      // 1. Delete all reflections in subcollection
      const refCol = collection(firestore, 'submissions', id, 'reflections');
      const snap = await getDocs(refCol);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Delete parent submission document
      await deleteDoc(doc(firestore, 'submissions', id));

      // 3. Delete from local cache
      await this.localRepo.deleteSubmissionWithReflections(id);
      return true;
    } catch (err) {
      console.warn('[FirestoreQuizRepository] Delete failed:', (err as Error).message);
      return false;
    }
  }

  async getAggregateAnalytics(): Promise<SubmissionAnalytics> {
    const submissions = await this.listSubmissions();
    return calculateAnalyticsFromSubmissions(submissions);
  }
}
