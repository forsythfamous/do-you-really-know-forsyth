import { ResultTier, ResultTierId, ScoreCalculation } from '../types';

export const RESULT_TIERS: Record<ResultTierId, ResultTier> = {
  have_we_even_met: {
    id: 'have_we_even_met',
    title: 'Have We Even Met?',
    tone: 'Playfully shocked',
    minPercentage: 0,
    maxPercentage: 30,
    reaction: "Wait... are we sure you're thinking of the right Forsyth? Did someone send you the wrong link, or have you two literally only crossed paths in an elevator?",
    badgeLabel: 'Mysterious Stranger',
  },
  casual_associate: {
    id: 'casual_associate',
    title: 'Casual Forsyth Associate',
    tone: 'Friendly challenge',
    minPercentage: 31,
    maxPercentage: 50,
    reaction: "You know some highlights, but there are definitely a few blind spots! You've got the basics down, but Forsyth still has some mystery left for you.",
    badgeLabel: 'Casual Acquaintance',
  },
  certified_friend: {
    id: 'certified_friend',
    title: 'Certified Forsyth Friend',
    tone: 'Warm approval',
    minPercentage: 51,
    maxPercentage: 70,
    reaction: "Solid knowledge! You clearly pay attention when Forsyth talks and you know what makes him tick. Officially a certified friend!",
    badgeLabel: 'Certified Friend',
  },
  inner_circle: {
    id: 'inner_circle',
    title: 'Inner-Circle Material',
    tone: 'Impressed',
    minPercentage: 71,
    maxPercentage: 89,
    reaction: "Impressive! You know the real details—from the daily habits to the core values. You're undeniably in Forsyth's trusted inner circle.",
    badgeLabel: 'Inner Circle',
  },
  know_too_well: {
    id: 'know_too_well',
    title: 'You Know Forsyth Too Well',
    tone: 'Dramatic and celebratory',
    minPercentage: 90,
    maxPercentage: 100,
    reaction: "Incredible! Either you live in Forsyth's head rent-free, or you've been taking secret notes. You practically know Forsyth better than he knows himself!",
    badgeLabel: 'Chief Forsyth Historian',
  },
};

/**
 * Pure, deterministic function to find the appropriate result tier for a given percentage.
 * Exact boundary adherence:
 *  0 - 30% -> Have We Even Met?
 * 31 - 50% -> Casual Forsyth Associate
 * 51 - 70% -> Certified Forsyth Friend
 * 71 - 89% -> Inner-Circle Material
 * 90 - 100% -> You Know Forsyth Too Well
 */
export function getTierForPercentage(percentage: number): ResultTier {
  const rounded = Math.round(Math.max(0, Math.min(100, percentage)));

  if (rounded <= 30) {
    return RESULT_TIERS.have_we_even_met;
  }
  if (rounded <= 50) {
    return RESULT_TIERS.casual_associate;
  }
  if (rounded <= 70) {
    return RESULT_TIERS.certified_friend;
  }
  if (rounded <= 89) {
    return RESULT_TIERS.inner_circle;
  }
  return RESULT_TIERS.know_too_well;
}

/**
 * Pure, deterministic calculation of quiz score:
 * Formula: correct answers / presented scored questions x 100, rounded to the nearest whole number.
 */
export function calculateQuizScore(
  answers: Record<number, { isCorrect: boolean }>,
  totalQuestions: number,
): ScoreCalculation {
  if (totalQuestions <= 0) {
    return {
      correctCount: 0,
      totalQuestions: 0,
      scorePercentage: 0,
      tier: RESULT_TIERS.have_we_even_met,
    };
  }

  let correctCount = 0;
  for (const answer of Object.values(answers)) {
    if (answer.isCorrect) {
      correctCount += 1;
    }
  }

  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const tier = getTierForPercentage(scorePercentage);

  return {
    correctCount,
    totalQuestions,
    scorePercentage,
    tier,
  };
}
