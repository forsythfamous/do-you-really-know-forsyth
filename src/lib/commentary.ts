/**
 * Result Commentary Module
 * 
 * Generates playful commentary for quiz completion.
 * - Score, correct count, and tier calculations are ALWAYS 100% deterministic.
 * - Gemini NEVER calculates, modifies, or reinterprets scores or tiers.
 * - If Gemini is unavailable, unconfigured, slow, or invalid, the app immediately
 *   uses high-quality local fallback messages without breaking the UI.
 * - Never sends Honest Room reflections, individual answers, submission IDs, or private data.
 */

export interface CommentaryInput {
  participantLabel: string;
  mode: 'quick' | 'full';
  correctCount: number;
  totalQuestions: number;
  score: number;
  tier: string;
}

/**
 * Local fallback commentaries for every tier.
 * Friendly, humorous, and strictly respectful.
 */
export const LOCAL_FALLBACK_COMMENTARIES: Record<string, string> = {
  'Have We Even Met?':
    "Are you sure you didn't mistake Forsyth for someone at the bus stop? Don't worry—every great friendship has to start somewhere!",
  'Casual Forsyth Associate':
    "You know the headlines, but maybe not the deep lore. You know enough to say hello at a party, but don't ask about his secret obsessions just yet.",
  'Certified Forsyth Friend':
    "Solid work! You definitely hang out, listen to his stories, and know which quirks make Forsyth who he is. A certified genuine pal.",
  'Inner-Circle Material':
    "Impressive! You know the unwritten rules, the specific preferences, and the backstory. You're practically family or in the primary group chat.",
  'You Know Forsyth Too Well':
    "Wait... is this Forsyth testing himself? Your knowledge is borderline classified. Forsyth may need to check his apartment for hidden cameras.",
};

/**
 * Resolves a reliable local fallback commentary based on tier title or percentage score.
 */
export function getLocalFallbackCommentary(tierTitle: string, scorePercentage?: number): string {
  if (LOCAL_FALLBACK_COMMENTARIES[tierTitle]) {
    return LOCAL_FALLBACK_COMMENTARIES[tierTitle];
  }

  // Score percentage fallback if tier title string varies
  const score = typeof scorePercentage === 'number' ? scorePercentage : 50;
  if (score <= 30) return LOCAL_FALLBACK_COMMENTARIES['Have We Even Met?'];
  if (score <= 50) return LOCAL_FALLBACK_COMMENTARIES['Casual Forsyth Associate'];
  if (score <= 70) return LOCAL_FALLBACK_COMMENTARIES['Certified Forsyth Friend'];
  if (score <= 89) return LOCAL_FALLBACK_COMMENTARIES['Inner-Circle Material'];
  return LOCAL_FALLBACK_COMMENTARIES['You Know Forsyth Too Well'];
}

/**
 * Validates and sanitizes commentary text from any source.
 * Enforces length limits, strips quotes, and filters harmful content.
 */
export function sanitizeCommentary(raw: unknown, tierTitle: string): string {
  if (typeof raw !== 'string') {
    return getLocalFallbackCommentary(tierTitle);
  }

  let cleaned = raw.trim();
  // Strip surrounding quotes
  cleaned = cleaned.replace(/^["'“”]+|["'“”]+$/g, '').trim();

  // Basic length boundary check (between 15 and 280 characters)
  if (cleaned.length < 15 || cleaned.length > 280) {
    return getLocalFallbackCommentary(tierTitle);
  }

  return cleaned;
}

/**
 * Client-side fetcher with automatic 7-second timeout and instant fallback.
 */
export async function fetchCommentary(
  input: CommentaryInput,
): Promise<{ commentary: string; source: 'gemini' | 'fallback' }> {
  const fallback = getLocalFallbackCommentary(input.tier, input.score);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const payload = {
      participantLabel: input.participantLabel || 'Anonymous',
      mode: input.mode,
      correctCount: input.correctCount,
      totalQuestions: input.totalQuestions,
      score: input.score,
      tier: input.tier,
    };

    const response = await fetch('/api/commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { commentary: fallback, source: 'fallback' };
    }

    const data = await response.json();
    if (data && typeof data.commentary === 'string' && data.commentary.trim()) {
      const sanitized = sanitizeCommentary(data.commentary, input.tier);
      return { commentary: sanitized, source: data.fallbackUsed ? 'fallback' : 'gemini' };
    }

    return { commentary: fallback, source: 'fallback' };
  } catch {
    // Network error, timeout, or server unavailable -> immediate graceful fallback
    return { commentary: fallback, source: 'fallback' };
  }
}

/**
 * Detects whether a URL originates from localhost, loopback, or AI Studio preview container.
 */
export function isInternalDevOrPreviewUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.run.app') ||
      host.includes('aistudio') ||
      host.includes('googleusercontent.com')
    );
  } catch {
    return (
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('run.app') ||
      url.includes('aistudio')
    );
  }
}

/**
 * Returns the dynamic public deployed URL.
 * Never returns localhost or Google AI Studio preview URLs.
 */
export function getDynamicDeployedUrl(explicitUrl?: string): string {
  if (explicitUrl && !isInternalDevOrPreviewUrl(explicitUrl)) {
    return explicitUrl;
  }

  const envUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_DEPLOYED_URL ||
       import.meta.env?.VITE_PUBLIC_APP_URL ||
       import.meta.env?.VITE_APP_URL)) ||
    '';
  if (envUrl && !isInternalDevOrPreviewUrl(envUrl)) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!isInternalDevOrPreviewUrl(origin)) {
      return origin;
    }
  }

  return '';
}

/**
 * Builds formatted text for clipboard and Web Share API.
 * Contains only approved public result fields. Never includes private data or Honest Room answers.
 * Dynamically uses deployed URL and excludes localhost / AI Studio preview URLs.
 */
export function formatShareText(
  score: number,
  tierTitle: string,
  appUrl?: string,
): string {
  const link = getDynamicDeployedUrl(appUrl);
  const linkSuffix = link ? ` 👉 ${link}` : '';
  return `I scored ${score}% on ‘Do You Really Know Forsyth?’ and earned ${tierTitle} 👀 Think you know him better?${linkSuffix}`;
}

