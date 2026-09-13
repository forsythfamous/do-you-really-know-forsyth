import { HonestRoomQuestion } from '../types';

export const THREE_WORDS_QUESTION_ID = 56;

export const HONEST_ROOM_QUESTIONS: HonestRoomQuestion[] = [
  {
    id: 46,
    order: 1,
    prompt: 'What is your honest first impression of Forsyth?',
    category: 'First Impressions',
  },
  {
    id: 48,
    order: 2,
    prompt: 'What is your favourite memory with Forsyth?',
    category: 'Memories',
  },
  {
    id: 49,
    order: 3,
    prompt: 'What is one thing you genuinely admire about Forsyth?',
    category: 'Character',
  },
  {
    id: 50,
    order: 4,
    prompt: 'What is one thing Forsyth does that annoys you?',
    category: 'Critique & Annoyance',
  },
  {
    id: 52,
    order: 5,
    prompt: 'What is one thing Forsyth could improve about himself?',
    category: 'Growth',
  },
  {
    id: 55,
    order: 6,
    prompt: 'What kind of husband do you think Forsyth would be?',
    category: 'Future & Relationships',
  },
  {
    id: 56,
    order: 7,
    prompt: 'Describe Forsyth in exactly three words.',
    category: 'Summary',
    isThreeWordsQuestion: true,
  },
  {
    id: 58,
    order: 8,
    prompt: 'If Forsyth were a character in a film, what kind of character would he be?',
    category: 'Archetype',
  },
  {
    id: 59,
    order: 9,
    prompt: 'What is something you have always wanted to tell Forsyth?',
    category: 'Unspoken Words',
  },
  {
    id: 60,
    order: 10,
    prompt: 'Leave Forsyth a message, memory, prayer or honest confession.',
    category: 'Open Mic',
  },
];

/**
 * Validates Question 56 answer: exactly three non-empty words if answered.
 * If empty or whitespace-only, it is considered skipped (allowed).
 * Attached strictly to canonical question ID 56.
 */
export function validateThreeWordsAnswer(text: string): {
  isValid: boolean;
  wordCount: number;
  error?: string;
} {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: true, wordCount: 0 };
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 3) {
    return { isValid: true, wordCount: 3 };
  }
  return {
    isValid: false,
    wordCount: words.length,
    error: `Please enter exactly 3 words (currently ${words.length}), or leave blank to skip.`,
  };
}
