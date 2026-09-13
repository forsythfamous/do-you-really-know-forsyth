export type ParticipantType = 'named' | 'anonymous';

export interface ParticipantIdentity {
  type: ParticipantType;
  displayName: string | null;
}

export type GameMode = 'quick' | 'full';
export type SubmissionMode = GameMode;
export type ReflectionCompletionStatus = 'not_started' | 'skipped' | 'completed';

export interface QuestionOption {
  id: string; // Canonical option ID (e.g. 'opt-a')
  label: string;
}

export interface Question {
  id: number; // Canonical question number matching specification
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  correctAnswerText: string;
  category: string;
  order: number;
  active: boolean;
}

export interface ShuffledQuestion extends Question {
  shuffledOptions: QuestionOption[];
}

export interface AnswerRecord {
  questionId: number;
  selectedOptionId: string;
  selectedOptionLabel: string;
  isCorrect: boolean;
  correctOptionId: string;
  correctAnswerText: string;
  timestamp: number;
}

export type ResultTierId =
  | 'have_we_even_met'
  | 'casual_associate'
  | 'certified_friend'
  | 'inner_circle'
  | 'know_too_well';

export interface ResultTier {
  id: ResultTierId;
  title: string;
  tone: string;
  minPercentage: number;
  maxPercentage: number;
  reaction: string;
  badgeLabel: string;
}

export interface ScoreCalculation {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  tier: ResultTier;
}

export interface QuizSession {
  sessionId: string;
  participant: ParticipantIdentity;
  mode: GameMode;
  questionIds: number[];
  shuffledQuestions: ShuffledQuestion[];
  currentQuestionIndex: number;
  answers: Record<number, AnswerRecord>;
  isCompleted: boolean;
  startedAt: number;
  completedAt?: number;
  scoreResult?: ScoreCalculation;
  suspenseSeen?: boolean;
}

export interface HonestRoomQuestion {
  id: number;
  prompt: string;
  category: string;
  order: number;
  isThreeWordsQuestion?: boolean;
}

export interface HonestRoomDraft {
  submissionId: string;
  participant: ParticipantIdentity;
  mode: SubmissionMode;
  reflections: Record<number, string>;
  currentQuestionIndex: number;
  linkedQuizSessionId?: string;
  updatedAt: number;
  schemaVersion: number;
}

export interface QuizSubmission {
  submissionId: string;
  ownerUid?: string;
  participantType: ParticipantType;
  displayName: string | null;
  mode: GameMode;
  questionIds: number[];
  selectedAnswers: Record<number, AnswerRecord>;
  correctCount: number;
  totalQuestions: number;
  score: number;
  tier: string;
  reflections?: Record<number, string>;
  reflectionCompletionStatus: ReflectionCompletionStatus;
  startedAt?: string | number;
  completedAt?: string | number;
  createdAt?: unknown;
  quizCompletedAt: string;
  submittedAt: string;
  schemaVersion: number;
}

export type AppRoute =
  | 'landing'
  | 'identity'
  | 'mode'
  | 'quiz'
  | 'results'
  | 'honest'
  | 'honest-review'
  | 'thank-you'
  | 'admin'
  | 'admin-submissions'
  | 'admin-submission-detail'
  | 'admin-reflections'
  | 'admin-analytics';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isAuthorizedAdmin: boolean;
  isDevMode?: boolean;
}

export interface QuestionStat {
  questionId: number;
  prompt: string;
  timesPresented: number;
  timesCorrect: number;
  accuracyPercentage: number;
  quickPlayPresents: number;
  fullChallengePresents: number;
  mostCommonWrongOptionId?: string;
  mostCommonWrongOptionLabel?: string;
}

export interface SubmissionAnalytics {
  totalSubmissions: number;
  averageScore: number;
  quickPlayCount: number;
  fullChallengeCount: number;
  namedCount: number;
  anonymousCount: number;
  honestCompletedCount: number;
  honestSkippedCount: number;
  completionRate: number;
  tierDistribution: Record<string, number>;
  quickPlayAvgScore: number;
  fullChallengeAvgScore: number;
  mostCorrectQuestionId?: number;
  mostMissedQuestionId?: number;
  questionStats: Record<number, QuestionStat>;
}

export interface SubmissionFilters {
  searchQuery: string;
  mode: 'all' | 'quick' | 'full';
  participantType: 'all' | 'named' | 'anonymous';
  tier: string;
  reflectionStatus: 'all' | 'not_started' | 'skipped' | 'completed';
  sortBy: 'newest' | 'oldest' | 'score_high' | 'score_low';
}

