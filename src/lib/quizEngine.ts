import { CANONICAL_QUESTIONS } from '../data/canonicalQuestions';
import { Question, QuestionOption, ShuffledQuestion } from '../types';

/**
 * Pure Fisher-Yates array shuffle returning a newly copied array.
 */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Prepares a question for the participant by shuffling its options
 * while preserving canonical IDs and answer correctness.
 */
export function prepareShuffledQuestion(question: Question): ShuffledQuestion {
  const shuffledOptions: QuestionOption[] = shuffleArray(question.options);
  return {
    ...question,
    shuffledOptions,
  };
}

/**
 * Selects 12 random scored questions from the canonical question bank for Quick Play,
 * shuffles their presentation order, and shuffles their answer options.
 */
export function generateQuickPlayQuestions(): ShuffledQuestion[] {
  // Available active scored questions from canonical pool
  const activeQuestions = CANONICAL_QUESTIONS.filter((q) => q.active);
  const shuffledPool = shuffleArray(activeQuestions);
  // Pick exactly 12 questions
  const selected = shuffledPool.slice(0, 12);
  // Prepare each question with shuffled options
  return selected.map(prepareShuffledQuestion);
}

/**
 * Selects all 28 canonical scored questions for Full Challenge:
 * - Shuffles the first 26 questions (all except canonical questions 61 and 62)
 * - Always places canonical Questions 61 and 62 as the final two questions
 * - Shuffles answer options for each of the 28 questions
 */
export function generateFullChallengeQuestions(): ShuffledQuestion[] {
  const activeQuestions = CANONICAL_QUESTIONS.filter((q) => q.active);
  const regularQuestions = activeQuestions.filter((q) => q.id !== 61 && q.id !== 62);
  const shuffledRegular = shuffleArray(regularQuestions);

  const loveQ61 = activeQuestions.find((q) => q.id === 61);
  const loveQ62 = activeQuestions.find((q) => q.id === 62);

  if (!loveQ61 || !loveQ62) {
    throw new Error('Canonical Love questions (IDs 61 and 62) missing in canonical pool');
  }

  const fullSequence = [...shuffledRegular, loveQ61, loveQ62];
  return fullSequence.map(prepareShuffledQuestion);
}


/**
 * Validates whether an answer given for a question is correct.
 * Checks against the immutable canonical correctOptionId.
 */
export function isAnswerCorrect(
  question: Question,
  selectedOptionId: string,
): boolean {
  return question.correctOptionId === selectedOptionId;
}
