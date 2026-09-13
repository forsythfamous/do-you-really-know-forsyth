import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { LandingView } from './components/LandingView';
import { IdentityView } from './components/IdentityView';
import { ModeSelectionView } from './components/ModeSelectionView';
import { QuizView } from './components/QuizView';
import { SuspenseView } from './components/SuspenseView';
import { ResultsView } from './components/ResultsView';
import { HonestRoomView } from './components/HonestRoomView';
import { HonestRoomReviewView } from './components/HonestRoomReviewView';
import { ThankYouView } from './components/ThankYouView';
import { DiscardConfirmModal } from './components/DiscardConfirmModal';
import {
  AppRoute,
  ParticipantIdentity,
  GameMode,
  QuizSession,
  QuestionOption,
  QuizSubmission,
  HonestRoomDraft,
  AdminUser,
  SubmissionAnalytics,
} from './types';
import {
  generateQuickPlayQuestions,
  generateFullChallengeQuestions,
  isAnswerCorrect,
} from './lib/quizEngine';
import { calculateQuizScore } from './lib/scoring';
import { defaultQuizRepository } from './lib/repository';
import { defaultAdminAuthProvider } from './lib/auth';
import { isFirebaseConfigured, ensureAnonymousParticipant } from './lib/firebase';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { AdminOverviewView } from './components/admin/AdminOverviewView';
import { AdminSubmissionsView } from './components/admin/AdminSubmissionsView';
import { AdminSubmissionDetailView } from './components/admin/AdminSubmissionDetailView';
import { AdminReflectionsView } from './components/admin/AdminReflectionsView';
import { AdminAnalyticsView } from './components/admin/AdminAnalyticsView';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Participant identity
  const [participant, setParticipant] = useState<ParticipantIdentity | null>(null);

  // Quiz active session
  const [session, setSession] = useState<QuizSession | null>(null);

  // Honest Room draft
  const [honestDraft, setHonestDraft] = useState<HonestRoomDraft | null>(null);

  // Completed submission (for Thank You view or Results view recovery)
  const [lastSubmission, setLastSubmission] = useState<QuizSubmission | null>(null);

  // Honest Room submission state
  const [isSubmittingHonest, setIsSubmittingHonest] = useState<boolean>(false);

  // Quiz submission state for friendly retryable error handling
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);
  const [quizSubmitError, setQuizSubmitError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Discard Confirmation Modal
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false);

  // Admin auth & data state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(
    defaultAdminAuthProvider.getCurrentAdmin(),
  );
  const [adminSubmissions, setAdminSubmissions] = useState<QuizSubmission[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<SubmissionAnalytics>({
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
  });
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isAdminDataLoading, setIsAdminDataLoading] = useState<boolean>(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);

  // Helper to parse admin routes from hash
  const parseAdminHash = (rawHash: string): { route: AppRoute; detailId?: string } | null => {
    if (rawHash === 'admin' || rawHash === 'admin/') {
      return { route: 'admin' };
    }
    if (rawHash === 'admin/submissions' || rawHash === 'admin-submissions') {
      return { route: 'admin-submissions' };
    }
    if (rawHash.startsWith('admin/submissions/')) {
      const detailId = rawHash.replace('admin/submissions/', '');
      return { route: 'admin-submission-detail', detailId };
    }
    if (rawHash === 'admin/reflections' || rawHash === 'admin-reflections') {
      return { route: 'admin-reflections' };
    }
    if (rawHash === 'admin/analytics' || rawHash === 'admin-analytics') {
      return { route: 'admin-analytics' };
    }
    return null;
  };

  // Hash route synchronization helper
  const navigateTo = useCallback((newRoute: AppRoute, detailId?: string) => {
    setRoute(newRoute);
    if (newRoute === 'admin') {
      window.location.hash = '#/admin';
    } else if (newRoute === 'admin-submissions') {
      window.location.hash = '#/admin/submissions';
    } else if (newRoute === 'admin-submission-detail' && detailId) {
      setSelectedSubmissionId(detailId);
      window.location.hash = `#/admin/submissions/${detailId}`;
    } else if (newRoute === 'admin-reflections') {
      window.location.hash = '#/admin/reflections';
    } else if (newRoute === 'admin-analytics') {
      window.location.hash = '#/admin/analytics';
    } else {
      window.location.hash = `#/${newRoute}`;
    }
  }, []);

  const refreshAdminData = useCallback(async () => {
    setIsAdminDataLoading(true);
    setAdminDataError(null);
    try {
      const list = await defaultQuizRepository.listSubmissions();
      const analytics = await defaultQuizRepository.getAggregateAnalytics();
      setAdminSubmissions(list);
      setAdminAnalytics(analytics);
    } catch (err) {
      console.warn('Could not load admin data:', err);
      setAdminDataError((err as Error).message || 'Failed to retrieve submissions from database.');
    } finally {
      setIsAdminDataLoading(false);
    }
  }, []);

  // Subscribe to auth state
  useEffect(() => {
    const unsub = defaultAdminAuthProvider.subscribeToAuthState((user) => {
      setAdminUser(user);
      if (!user || !user.isAuthorizedAdmin) {
        // Clear sensitive admin data immediately upon signout
        setAdminSubmissions([]);
        setAdminAnalytics({
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
        });
        setSelectedSubmissionId(null);
      }
    });
    return unsub;
  }, []);

  // When adminUser is authorized or route is an admin route, refresh admin data
  useEffect(() => {
    if (adminUser?.isAuthorizedAdmin && route.startsWith('admin')) {
      refreshAdminData();
    }
  }, [adminUser, route, refreshAdminData]);

  // Initialize and check for existing session or draft on page load
  useEffect(() => {
    async function initApp() {
      try {
        setIsLoading(true);

        // Pre-initialize anonymous participant authentication if Firebase is active
        if (isFirebaseConfigured()) {
          ensureAnonymousParticipant().catch(() => null);
        }

        const storedSession = await defaultQuizRepository.loadActiveSession();
        const storedDraft = await defaultQuizRepository.loadHonestDraft();
        const storedLastSub = await defaultQuizRepository.getLastSubmission();

        if (storedLastSub) {
          setLastSubmission(storedLastSub);
        }

        const rawHash = window.location.hash.replace('#/', '');

        // Check if loading an admin route directly
        const adminRoute = parseAdminHash(rawHash);
        if (adminRoute) {
          setRoute(adminRoute.route);
          if (adminRoute.detailId) {
            setSelectedSubmissionId(adminRoute.detailId);
          }
          return;
        }

        const hash = rawHash as AppRoute;

        // 1. Check if user is in an active or completed quiz session
        if (storedSession) {
          setSession(storedSession);
          setParticipant(storedSession.participant);

          // If quiz is completed and user has a draft for Honest Room
          if (storedSession.isCompleted && storedSession.scoreResult) {
            if (storedDraft && (hash === 'honest' || hash === 'honest-review')) {
              setHonestDraft(storedDraft);
              setRoute(hash);
              return;
            }

            if (hash === 'results') {
              setRoute('results');
              return;
            }

            if (hash === 'thank-you' && storedLastSub) {
              setRoute('thank-you');
              return;
            }

            // Default to results for a completed quiz
            setRoute('results');
            window.location.hash = '#/results';
            return;
          }

          if (storedSession.shuffledQuestions.length > 0) {
            // Check if Full Challenge was on the Suspense screen
            if (
              storedSession.mode === 'full' &&
              storedSession.currentQuestionIndex === 26 &&
              !storedSession.suspenseSeen
            ) {
              setRoute('suspense');
              window.location.hash = '#/quiz';
              return;
            }

            if (hash === 'quiz') {
              setRoute('quiz');
              return;
            }
          }
        }

        // 2. Strict Guard: If trying to access honest/honest-review without a completed quiz
        if (hash === 'honest' || hash === 'honest-review') {
          // No active completed session — redirect to landing
          setRoute('landing');
          window.location.hash = '#/landing';
          return;
        }

        // 3. Fallback route parsing
        if (['identity', 'mode', 'quiz', 'results', 'thank-you'].includes(hash)) {
          setRoute(hash);
        } else {
          setRoute('landing');
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
        setErrorMessage('Could not load saved session data.');
      } finally {
        setIsLoading(false);
      }
    }

    initApp();

    // Handle browser back/forward navigation
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#/', '');
      const adminMatch = parseAdminHash(rawHash);
      if (adminMatch) {
        setRoute(adminMatch.route);
        if (adminMatch.detailId) {
          setSelectedSubmissionId(adminMatch.detailId);
        }
        return;
      }

      const hashRoute = rawHash as AppRoute;
      if (
        [
          'landing',
          'identity',
          'mode',
          'quiz',
          'results',
          'honest',
          'honest-review',
          'thank-you',
        ].includes(hashRoute)
      ) {
        setRoute(hashRoute);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auto-persist active quiz session
  useEffect(() => {
    if (session) {
      defaultQuizRepository.saveActiveSession(session);
    }
  }, [session]);

  // Auto-persist Honest Room draft
  useEffect(() => {
    if (honestDraft) {
      defaultQuizRepository.saveHonestDraft(honestDraft);
    }
  }, [honestDraft]);

  // Guard against direct route navigation to honest or honest-review without a valid completed quiz
  useEffect(() => {
    if (isLoading) return;
    if (route === 'honest' || route === 'honest-review') {
      if (!session || !session.isCompleted || !session.scoreResult) {
        navigateTo('landing');
      } else if (!honestDraft) {
        navigateTo('results');
      }
    }
  }, [route, isLoading, session, honestDraft, navigateTo]);

  // -------------------------------------------------------------
  // NAVIGATION & RESET HANDLERS
  // -------------------------------------------------------------
  const inProgressQuiz = Boolean(session && !session.isCompleted && route === 'quiz');
  const inProgressHonest = Boolean(honestDraft && (route === 'honest' || route === 'honest-review'));

  const handleRequestReset = () => {
    if (inProgressQuiz || inProgressHonest) {
      setIsDiscardModalOpen(true);
    } else {
      handleConfirmDiscard();
    }
  };

  const handleConfirmDiscard = async () => {
    setIsDiscardModalOpen(false);
    await defaultQuizRepository.clearActiveSession();
    await defaultQuizRepository.clearHonestDraft();
    setSession(null);
    setHonestDraft(null);
    navigateTo('landing');
  };

  const handleStartChallenge = () => {
    if (participant) {
      navigateTo('mode');
    } else {
      navigateTo('identity');
    }
  };

  const handleResumeChallenge = () => {
    if (session && session.shuffledQuestions.length > 0) {
      if (
        session.mode === 'full' &&
        session.currentQuestionIndex === 26 &&
        !session.suspenseSeen
      ) {
        setRoute('suspense');
      } else {
        navigateTo('quiz');
      }
    }
  };

  const handleSelectIdentity = (identity: ParticipantIdentity) => {
    setParticipant(identity);
    navigateTo('mode');
  };

  // -------------------------------------------------------------
  // MODE SELECTION & QUIZ INITIALIZATION
  // -------------------------------------------------------------
  const handleSelectMode = (mode: GameMode) => {
    if (!participant) {
      navigateTo('identity');
      return;
    }

    const questions =
      mode === 'full'
        ? generateFullChallengeQuestions()
        : generateQuickPlayQuestions();

    const newSession: QuizSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      participant,
      mode,
      questionIds: questions.map((q) => q.id),
      shuffledQuestions: questions,
      currentQuestionIndex: 0,
      answers: {},
      isCompleted: false,
      startedAt: Date.now(),
      suspenseSeen: false,
    };

    setSession(newSession);
    navigateTo('quiz');
  };

  // -------------------------------------------------------------
  // QUIZ GAMEPLAY
  // -------------------------------------------------------------
  const handleAnswerQuestion = (questionId: number, selectedOption: QuestionOption) => {
    if (!session) return;

    const currentQuestion = session.shuffledQuestions[session.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id !== questionId) return;
    if (session.answers[questionId]) return;

    const correct = isAnswerCorrect(currentQuestion, selectedOption.id);

    const updatedAnswers = {
      ...session.answers,
      [questionId]: {
        questionId,
        selectedOptionId: selectedOption.id,
        selectedOptionLabel: selectedOption.label,
        isCorrect: correct,
        correctOptionId: currentQuestion.correctOptionId,
        correctAnswerText: currentQuestion.correctAnswerText,
        timestamp: Date.now(),
      },
    };

    setSession({
      ...session,
      answers: updatedAnswers,
    });
  };

  const handleNextQuestion = async () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    const totalQuestions = session.shuffledQuestions.length;

    // Check for Full Challenge Suspense Transition before Question 61 (index 26)
    if (
      session.mode === 'full' &&
      nextIndex === 26 &&
      !session.suspenseSeen
    ) {
      setRoute('suspense');
      return;
    }

    if (nextIndex < totalQuestions) {
      setSession({
        ...session,
        currentQuestionIndex: nextIndex,
      });
    } else {
      // Quiz finished: compute deterministic score
      const scoreResult = calculateQuizScore(session.answers, totalQuestions);

      const completedSession: QuizSession = {
        ...session,
        isCompleted: true,
        completedAt: Date.now(),
        scoreResult,
      };

      setSession(completedSession);

      // Requirement 10: Persist completed quiz submission using the same stable session ID
      const submission: QuizSubmission = {
        submissionId: session.sessionId,
        participantType: session.participant.type,
        displayName:
          session.participant.type === 'anonymous'
            ? null
            : (session.participant.displayName || null),
        mode: session.mode,
        questionIds: session.questionIds,
        selectedAnswers: session.answers,
        correctCount: scoreResult.correctCount,
        totalQuestions: totalQuestions,
        score: scoreResult.scorePercentage,
        tier: scoreResult.tier.title,
        reflections: {},
        reflectionCompletionStatus: 'not_started',
        startedAt: new Date(session.startedAt || Date.now()).toISOString(),
        completedAt: new Date().toISOString(),
        quizCompletedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        schemaVersion: 2,
      };

      // Requirement 8: Preserve completed quiz result immediately on client
      setLastSubmission(submission);

      setIsSubmittingQuiz(true);
      setQuizSubmitError(null);

      try {
        await defaultQuizRepository.saveSubmission(submission);
        setIsSubmittingQuiz(false);
        navigateTo('results');
      } catch (err) {
        console.error('[App] Quiz submission save failed:', err);
        setIsSubmittingQuiz(false);
        // Requirement 9: Show a friendly retryable save error instead of freezing
        setQuizSubmitError(
          (err as Error)?.message || 'Cloud write delayed. You can retry syncing or proceed directly to your results.'
        );
      }
    }
  };

  // Requirement 10: Retry using the same stable submission ID to prevent duplicates
  const handleRetrySubmitQuiz = async () => {
    if (!session || !session.scoreResult) return;
    setIsSubmittingQuiz(true);
    setQuizSubmitError(null);

    const submission: QuizSubmission = {
      submissionId: session.sessionId,
      participantType: session.participant.type,
      displayName:
        session.participant.type === 'anonymous'
          ? null
          : (session.participant.displayName || null),
      mode: session.mode,
      questionIds: session.questionIds,
      selectedAnswers: session.answers,
      correctCount: session.scoreResult.correctCount,
      totalQuestions: session.shuffledQuestions.length,
      score: session.scoreResult.scorePercentage,
      tier: session.scoreResult.tier.title,
      reflections: {},
      reflectionCompletionStatus: 'not_started',
      startedAt: new Date(session.startedAt || Date.now()).toISOString(),
      completedAt: new Date().toISOString(),
      quizCompletedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      schemaVersion: 2,
    };

    try {
      await defaultQuizRepository.saveSubmission(submission);
      setLastSubmission(submission);
      setIsSubmittingQuiz(false);
      navigateTo('results');
    } catch (err) {
      console.error('[App] Quiz submission retry failed:', err);
      setIsSubmittingQuiz(false);
      setQuizSubmitError((err as Error)?.message || 'Unable to sync with Cloud Firestore.');
    }
  };

  const handleContinueToResultsAnyway = () => {
    if (session && session.scoreResult) {
      navigateTo('results');
    }
  };

  // Reveal love questions from Suspense screen
  const handleRevealLoveQuestions = () => {
    if (!session) return;
    setSession({
      ...session,
      currentQuestionIndex: 26,
      suspenseSeen: true,
    });
    setRoute('quiz');
  };

  // -------------------------------------------------------------
  // RESULTS VIEW HANDLERS
  // -------------------------------------------------------------
  const handleReplayQuick = async () => {
    await defaultQuizRepository.clearActiveSession();
    if (participant) {
      handleSelectMode('quick');
    } else {
      navigateTo('identity');
    }
  };

  const handleReplayFull = async () => {
    await defaultQuizRepository.clearActiveSession();
    if (participant) {
      handleSelectMode('full');
    } else {
      navigateTo('identity');
    }
  };

  const handleContinueToHonestRoom = () => {
    if (!session || !session.isCompleted) return;

    // Connect Honest Room to the completed quiz's submissionId
    const draft: HonestRoomDraft = {
      submissionId: session.sessionId,
      participant: session.participant,
      mode: session.mode,
      reflections: {},
      currentQuestionIndex: 0,
      linkedQuizSessionId: session.sessionId,
      updatedAt: Date.now(),
      schemaVersion: 2,
    };

    setHonestDraft(draft);
    navigateTo('honest');
  };

  // Participant chooses to skip Honest Room directly from Results
  const handleSkipAndFinishFromResults = async () => {
    if (!session || !session.scoreResult) return;

    const existing = (await defaultQuizRepository.loadSubmission(session.sessionId)) || lastSubmission;
    const isAnonymous = session.participant.type === 'anonymous';

    const submission: QuizSubmission = {
      submissionId: session.sessionId,
      participantType: session.participant.type,
      displayName: isAnonymous ? null : session.participant.displayName,
      mode: session.mode,
      questionIds: session.questionIds,
      selectedAnswers: session.answers,
      correctCount: session.scoreResult.correctCount,
      totalQuestions: session.shuffledQuestions.length,
      score: session.scoreResult.scorePercentage,
      tier: session.scoreResult.tier.title,
      reflections: existing?.reflections || {},
      reflectionCompletionStatus: 'skipped',
      quizCompletedAt: existing?.quizCompletedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      schemaVersion: 2,
    };

    await defaultQuizRepository.saveSubmission(submission);
    await defaultQuizRepository.clearHonestDraft();
    setLastSubmission(submission);
    setHonestDraft(null);
    navigateTo('thank-you');
  };

  // -------------------------------------------------------------
  // HONEST ROOM HANDLERS
  // -------------------------------------------------------------
  const handleHonestAnswerChange = (questionId: number, text: string) => {
    if (!honestDraft) return;
    const updated = {
      ...honestDraft,
      reflections: {
        ...honestDraft.reflections,
        [questionId]: text,
      },
      updatedAt: Date.now(),
    };
    setHonestDraft(updated);
  };

  const handleHonestNext = () => {
    if (!honestDraft) return;
    const nextIdx = honestDraft.currentQuestionIndex + 1;
    if (nextIdx < 10) {
      setHonestDraft({
        ...honestDraft,
        currentQuestionIndex: nextIdx,
        updatedAt: Date.now(),
      });
    } else {
      navigateTo('honest-review');
    }
  };

  const handleHonestPrev = () => {
    if (!honestDraft || honestDraft.currentQuestionIndex <= 0) return;
    setHonestDraft({
      ...honestDraft,
      currentQuestionIndex: honestDraft.currentQuestionIndex - 1,
      updatedAt: Date.now(),
    });
  };

  const handleHonestSkip = () => {
    handleHonestNext();
  };

  const handleHonestReview = () => {
    navigateTo('honest-review');
  };

  const handleHonestEditQuestion = (index: number) => {
    if (!honestDraft) return;
    setHonestDraft({
      ...honestDraft,
      currentQuestionIndex: index,
      updatedAt: Date.now(),
    });
    navigateTo('honest');
  };

  // Participant exits Honest Room back to Results without losing quiz results
  const handleExitHonestRoom = async () => {
    await defaultQuizRepository.clearHonestDraft();
    setHonestDraft(null);
    navigateTo('results');
  };

  // Participant skips remaining reflections from within Honest Room
  const handleSkipAndFinishFromHonest = async () => {
    if (!honestDraft) return;

    try {
      const existing = await defaultQuizRepository.loadSubmission(honestDraft.submissionId);
      if (!existing && (!session || !session.scoreResult)) {
        navigateTo('results');
        return;
      }

      const isAnonymous = honestDraft.participant.type === 'anonymous';
      const questionCount = session?.shuffledQuestions.length ?? existing?.totalQuestions ?? 0;
      const correctCount = session?.scoreResult?.correctCount ?? existing?.correctCount ?? 0;
      const score = session?.scoreResult?.scorePercentage ?? existing?.score ?? 0;
      const tier = session?.scoreResult?.tier.title ?? existing?.tier ?? '';

      const submission: QuizSubmission = {
        submissionId: honestDraft.submissionId,
        participantType: honestDraft.participant.type,
        displayName: isAnonymous ? null : honestDraft.participant.displayName,
        mode: honestDraft.mode,
        questionIds: session?.questionIds || existing?.questionIds || [],
        selectedAnswers: session?.answers || existing?.selectedAnswers || {},
        correctCount,
        totalQuestions: questionCount,
        score,
        tier,
        reflections: honestDraft.reflections || {},
        reflectionCompletionStatus: 'skipped',
        quizCompletedAt: existing?.quizCompletedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        schemaVersion: 2,
      };

      await defaultQuizRepository.saveSubmission(submission);
      await defaultQuizRepository.clearHonestDraft();

      setLastSubmission(submission);
      setHonestDraft(null);
      navigateTo('thank-you');
    } catch (err) {
      console.error('Failed to skip Honest Room:', err);
      navigateTo('results');
    }
  };

  // Final Submit for Honest Room attached to existing quiz submission
  const handleSubmitHonestFinal = async () => {
    if (!honestDraft || isSubmittingHonest) return;

    try {
      setIsSubmittingHonest(true);
      setSubmissionError(null);

      const existing = await defaultQuizRepository.loadSubmission(honestDraft.submissionId);
      if (!existing && (!session || !session.scoreResult)) {
        throw new Error('No completed quiz submission found to link reflections.');
      }

      const isAnonymous = honestDraft.participant.type === 'anonymous';
      const questionCount = session?.shuffledQuestions.length ?? existing?.totalQuestions ?? 0;
      const correctCount = session?.scoreResult?.correctCount ?? existing?.correctCount ?? 0;
      const score = session?.scoreResult?.scorePercentage ?? existing?.score ?? 0;
      const tier = session?.scoreResult?.tier.title ?? existing?.tier ?? '';

      const submission: QuizSubmission = {
        submissionId: honestDraft.submissionId,
        participantType: honestDraft.participant.type,
        displayName: isAnonymous ? null : honestDraft.participant.displayName,
        mode: honestDraft.mode,
        questionIds: session?.questionIds || existing?.questionIds || [],
        selectedAnswers: session?.answers || existing?.selectedAnswers || {},
        correctCount,
        totalQuestions: questionCount,
        score,
        tier,
        reflections: honestDraft.reflections,
        reflectionCompletionStatus: 'completed',
        quizCompletedAt: existing?.quizCompletedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        schemaVersion: 2,
      };

      await defaultQuizRepository.saveSubmission(submission);
      await defaultQuizRepository.clearHonestDraft();

      setLastSubmission(submission);
      setHonestDraft(null);
      navigateTo('thank-you');
    } catch (err) {
      console.error('Failed to submit Honest Room reflections:', err);
      setSubmissionError('Submission could not be completed. Please retry.');
    } finally {
      setIsSubmittingHonest(false);
    }
  };

  // -------------------------------------------------------------
  // ADMIN HANDLERS
  // -------------------------------------------------------------
  const handleAdminDeleteSubmission = async (submissionId: string) => {
    if (!defaultAdminAuthProvider.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Admin access required.');
    }
    const success = await defaultQuizRepository.deleteSubmissionWithReflections(submissionId);
    if (!success) {
      throw new Error('Could not delete submission.');
    }
    await refreshAdminData();
  };

  const handleAdminSignOut = async () => {
    await defaultAdminAuthProvider.signOut();
    setAdminUser(null);
    setAdminSubmissions([]);
    setAdminAnalytics({
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
    });
    setSelectedSubmissionId(null);
    navigateTo('admin');
  };

  // -------------------------------------------------------------
  // RENDERING & LAYOUT
  // -------------------------------------------------------------
  // Admin Route Handling (Protected Boundary)
  if (route.startsWith('admin')) {
    if (!adminUser || !adminUser.isAuthorizedAdmin) {
      return (
        <AdminLoginView
          authProvider={defaultAdminAuthProvider}
          onLoginSuccess={async (user) => {
            setAdminUser(user);
            await refreshAdminData();
          }}
          onReturnToApp={() => navigateTo('landing')}
        />
      );
    }

    const selectedSub = adminSubmissions.find((s) => s.submissionId === selectedSubmissionId) || null;

    return (
      <AdminLayout
        currentRoute={route}
        currentAdmin={adminUser}
        onNavigate={(r) => navigateTo(r)}
        onSignOut={handleAdminSignOut}
        onReturnToApp={() => navigateTo('landing')}
      >
        {route === 'admin' && (
          <AdminOverviewView
            analytics={adminAnalytics}
            onNavigate={navigateTo}
          />
        )}

        {route === 'admin-submissions' && (
          <AdminSubmissionsView
            submissions={adminSubmissions}
            onSelectSubmission={(id) => navigateTo('admin-submission-detail', id)}
            isLoading={isAdminDataLoading}
            error={adminDataError}
            onRetry={refreshAdminData}
          />
        )}

        {route === 'admin-submission-detail' && (
          <AdminSubmissionDetailView
            submission={selectedSub}
            onBack={() => navigateTo('admin-submissions')}
            onDeleteSubmission={handleAdminDeleteSubmission}
          />
        )}

        {route === 'admin-reflections' && (
          <AdminReflectionsView
            submissions={adminSubmissions}
          />
        )}

        {route === 'admin-analytics' && (
          <AdminAnalyticsView
            analytics={adminAnalytics}
          />
        )}
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <Layout
        currentRoute="landing"
        participant={null}
        onReset={handleRequestReset}
        inProgress={false}
      >
        <div
          id="app-loading-state"
          className="flex flex-col items-center justify-center p-12 text-center text-slate-300"
        >
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-base font-semibold">Loading Forsyth Challenge...</p>
        </div>
      </Layout>
    );
  }

  if (errorMessage) {
    return (
      <Layout
        currentRoute="landing"
        participant={null}
        onReset={handleRequestReset}
        inProgress={false}
      >
        <div
          id="app-error-state"
          className="bg-white rounded-3xl p-8 text-center text-slate-900 max-w-md mx-auto shadow-2xl"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold font-['Outfit'] mb-2">Something went wrong</h3>
          <p className="text-sm text-slate-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => {
              setErrorMessage(null);
              handleConfirmDiscard();
            }}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer"
          >
            Start Fresh
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      currentRoute={route}
      participant={participant}
      onReset={handleRequestReset}
      inProgress={inProgressQuiz || inProgressHonest}
    >
      {/* Route: Landing */}
      {route === 'landing' && (
        <LandingView
          onStart={handleStartChallenge}
          activeSession={session}
          onResume={handleResumeChallenge}
          onClearSession={handleRequestReset}
        />
      )}

      {/* Route: Participant Identity */}
      {route === 'identity' && (
        <IdentityView
          onSelectIdentity={handleSelectIdentity}
          onBack={() => navigateTo('landing')}
          initialName={participant?.displayName}
        />
      )}

      {/* Route: Mode Selection */}
      {route === 'mode' && participant && (
        <ModeSelectionView
          participant={participant}
          onSelectMode={handleSelectMode}
          onBack={() => navigateTo('identity')}
        />
      )}

      {/* Route: Mode Selection guard if participant missing */}
      {route === 'mode' && !participant && (
        <IdentityView
          onSelectIdentity={handleSelectIdentity}
          onBack={() => navigateTo('landing')}
        />
      )}

      {/* Route: Love Questions Suspense (Full Challenge only) */}
      {route === 'suspense' && (
        <SuspenseView onReveal={handleRevealLoveQuestions} />
      )}

      {/* Route: Quiz Questions */}
      {route === 'quiz' && session && session.shuffledQuestions.length > 0 && (
        <QuizView
          key={session.shuffledQuestions[session.currentQuestionIndex]?.id}
          question={session.shuffledQuestions[session.currentQuestionIndex]}
          questionIndex={session.currentQuestionIndex}
          totalQuestions={session.shuffledQuestions.length}
          existingAnswer={
            session.answers[
              session.shuffledQuestions[session.currentQuestionIndex]?.id
            ]
          }
          onAnswerQuestion={handleAnswerQuestion}
          onNextQuestion={handleNextQuestion}
          participantName={participant?.displayName || null}
          isSubmitting={isSubmittingQuiz}
          saveError={quizSubmitError}
          onRetrySubmit={handleRetrySubmitQuiz}
          onContinueAnyway={handleContinueToResultsAnyway}
        />
      )}

      {/* Route: Quiz Questions Empty State Guard */}
      {route === 'quiz' && (!session || session.shuffledQuestions.length === 0) && (
        <div
          id="quiz-empty-state"
          className="w-full bg-white rounded-3xl p-8 text-center text-slate-900 shadow-2xl max-w-lg mx-auto"
        >
          <h3 className="text-xl font-bold font-['Outfit'] mb-2">No Active Quiz Found</h3>
          <p className="text-sm text-slate-600 mb-6">
            There is no active quiz session in progress. Please choose a mode to begin.
          </p>
          <button
            onClick={() => navigateTo('mode')}
            className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer"
          >
            Go to Mode Selection
          </button>
        </div>
      )}

      {/* Route: Results */}
      {route === 'results' && session && session.scoreResult && participant && (
        <ResultsView
          scoreResult={session.scoreResult}
          participant={participant}
          mode={session.mode}
          shuffledQuestions={session.shuffledQuestions}
          answers={session.answers}
          onReplayQuick={handleReplayQuick}
          onReplayFull={handleReplayFull}
          onContinueHonestRoom={handleContinueToHonestRoom}
          onSkipAndFinish={handleSkipAndFinishFromResults}
          onGoHome={() => navigateTo('landing')}
        />
      )}

      {/* Route: Results Empty State Guard */}
      {route === 'results' && (!session || !session.scoreResult) && (
        <div
          id="results-empty-state"
          className="w-full bg-white rounded-3xl p-8 text-center text-slate-900 shadow-2xl max-w-lg mx-auto"
        >
          <h3 className="text-xl font-bold font-['Outfit'] mb-2">No Completed Quiz Found</h3>
          <p className="text-sm text-slate-600 mb-6">
            Complete a challenge to view your scorecard and results.
          </p>
          <button
            onClick={() => navigateTo('landing')}
            className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer"
          >
            Go to Home
          </button>
        </div>
      )}

      {/* Route: Honest Room Prompts */}
      {route === 'honest' && honestDraft && (
        <HonestRoomView
          participant={honestDraft.participant}
          currentQuestionIndex={honestDraft.currentQuestionIndex}
          reflections={honestDraft.reflections}
          onAnswerChange={handleHonestAnswerChange}
          onNext={handleHonestNext}
          onPrev={handleHonestPrev}
          onSkip={handleHonestSkip}
          onReview={handleHonestReview}
          onDiscard={handleExitHonestRoom}
          onSkipAndFinish={handleSkipAndFinishFromHonest}
        />
      )}

      {/* Route: Honest Room Prompts Empty Guard */}
      {route === 'honest' && !honestDraft && (
        <div
          id="honest-empty-state"
          className="w-full bg-white rounded-3xl p-8 text-center text-slate-900 shadow-2xl max-w-lg mx-auto"
        >
          <h3 className="text-xl font-bold font-['Outfit'] mb-2">No Active Honest Room Draft</h3>
          <p className="text-sm text-slate-600 mb-6">
            Start a new reflection session or play the quiz first.
          </p>
          <button
            onClick={() => navigateTo('mode')}
            className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer"
          >
            Go to Mode Selection
          </button>
        </div>
      )}

      {/* Route: Honest Room Review */}
      {route === 'honest-review' && honestDraft && (
        <HonestRoomReviewView
          participant={honestDraft.participant}
          reflections={honestDraft.reflections}
          isSubmitting={isSubmittingHonest}
          submissionError={submissionError}
          onEditQuestion={handleHonestEditQuestion}
          onSubmitFinal={handleSubmitHonestFinal}
          onBackToQuestions={() => navigateTo('honest')}
        />
      )}

      {/* Route: Thank You View */}
      {route === 'thank-you' && lastSubmission && (
        <ThankYouView
          submission={lastSubmission}
          onPlayAgain={() => {
            if (participant) {
              navigateTo('mode');
            } else {
              navigateTo('landing');
            }
          }}
          onGoHome={() => navigateTo('landing')}
        />
      )}

      {/* Route: Thank You Guard if no lastSubmission */}
      {route === 'thank-you' && !lastSubmission && (
        <div
          id="thank-you-empty-state"
          className="w-full bg-white rounded-3xl p-8 text-center text-slate-900 shadow-2xl max-w-lg mx-auto"
        >
          <h3 className="text-xl font-bold font-['Outfit'] mb-2">Thank you!</h3>
          <p className="text-sm text-slate-600 mb-6">
            Your responses have been saved.
          </p>
          <button
            onClick={() => navigateTo('landing')}
            className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      <DiscardConfirmModal
        isOpen={isDiscardModalOpen}
        title={inProgressHonest ? 'Discard Honest Room draft?' : 'Discard in-progress challenge?'}
        message={
          inProgressHonest
            ? 'Your unsaved reflections will be discarded. Are you sure you want to leave?'
            : 'Your current challenge progress and answered questions will be lost. Are you sure you want to exit?'
        }
        confirmLabel="Discard & Exit"
        cancelLabel="Keep Playing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setIsDiscardModalOpen(false)}
      />
    </Layout>
  );
}
