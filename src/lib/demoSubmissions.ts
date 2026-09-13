import { QuizSubmission } from '../types';

export interface DemoQuizSubmission extends QuizSubmission {
  isDemo: true;
}

/**
 * Isolated Demonstration Submissions.
 *
 * STRICT GOVERNANCE RULES:
 * 1. Demo data must NEVER be counted in real dashboard metrics.
 * 2. Demo data must NEVER be included in CSV exports.
 * 3. Demo data must NEVER be deleted as real records.
 * 4. Must be visible ONLY when the admin explicitly toggles "View Demo Data".
 * 5. Every demo record is prominently badged with "[DEMO]".
 */
export const DEMO_SUBMISSIONS: DemoQuizSubmission[] = [
  {
    isDemo: true,
    submissionId: 'demo-sub-001-alex',
    participantType: 'named',
    displayName: '[DEMO] Alex Rivera',
    mode: 'full',
    questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 61, 62],
    selectedAnswers: {
      1: { questionId: 1, selectedOptionId: '1a', selectedOptionLabel: 'Option A', isCorrect: true, correctOptionId: '1a', correctAnswerText: 'Option A', timestamp: 1715000000000 },
      61: { questionId: 61, selectedOptionId: '61a', selectedOptionLabel: 'Love Option A', isCorrect: true, correctOptionId: '61a', correctAnswerText: 'Love Option A', timestamp: 1715000001000 },
      62: { questionId: 62, selectedOptionId: '62a', selectedOptionLabel: 'Love Option B', isCorrect: true, correctOptionId: '62a', correctAnswerText: 'Love Option B', timestamp: 1715000002000 },
    },
    correctCount: 26,
    totalQuestions: 28,
    score: 93,
    tier: 'Forsyth Savant',
    reflections: {
      46: 'Genuinely one of the sharpest, most dependable friends I have known.',
      56: 'Loyal, brilliant, grounded',
      60: 'Proud of everything you have built, Forsyth! Keep pushing the limits.',
    },
    reflectionCompletionStatus: 'completed',
    quizCompletedAt: '2026-05-10T14:32:00.000Z',
    submittedAt: '2026-05-10T14:38:00.000Z',
    schemaVersion: 2,
  },
  {
    isDemo: true,
    submissionId: 'demo-sub-002-chloe',
    participantType: 'named',
    displayName: '[DEMO] Chloe Bennett',
    mode: 'quick',
    questionIds: [3, 7, 12, 14, 19, 22, 25, 29, 34, 40, 43, 45],
    selectedAnswers: {
      3: { questionId: 3, selectedOptionId: '3a', selectedOptionLabel: 'Option A', isCorrect: true, correctOptionId: '3a', correctAnswerText: 'Option A', timestamp: 1715010000000 },
    },
    correctCount: 10,
    totalQuestions: 12,
    score: 83,
    tier: 'Inner-Circle Material',
    reflections: {
      46: 'A thoughtful thinker with great humor.',
      56: 'Creative, witty, observant',
    },
    reflectionCompletionStatus: 'completed',
    quizCompletedAt: '2026-05-11T09:15:00.000Z',
    submittedAt: '2026-05-11T09:20:00.000Z',
    schemaVersion: 2,
  },
  {
    isDemo: true,
    submissionId: 'demo-sub-003-anon',
    participantType: 'anonymous',
    displayName: null,
    mode: 'full',
    questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 61, 62],
    selectedAnswers: {},
    correctCount: 17,
    totalQuestions: 28,
    score: 61,
    tier: 'Casual Acquaintance',
    reflections: {},
    reflectionCompletionStatus: 'skipped',
    quizCompletedAt: '2026-05-12T18:44:00.000Z',
    submittedAt: '2026-05-12T18:44:30.000Z',
    schemaVersion: 2,
  },
];
