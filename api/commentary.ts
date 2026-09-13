import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export interface ServerlessRequest {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: any) => void;
  setHeader?: (name: string, value: string) => ServerlessResponse;
}

/**
 * Vercel Serverless Function: POST /api/commentary
 * Generates AI commentary for completed quiz scores with strict privacy and 6-second timeout.
 */
export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse,
): Promise<void> {
  // Only allow POST requests
  if (req.method && req.method.toUpperCase() !== 'POST') {
    res.status(405).json({
      error: 'Method Not Allowed',
      fallbackUsed: true,
      commentary: null,
    });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const {
      participantLabel,
      mode,
      correctCount,
      totalQuestions,
      score,
      tier,
    } = body || {};

    // Deterministic parameter validation
    if (
      typeof score !== 'number' ||
      typeof correctCount !== 'number' ||
      typeof totalQuestions !== 'number' ||
      typeof tier !== 'string'
    ) {
      res.status(400).json({
        error: 'Invalid commentary parameters.',
        fallbackUsed: true,
        commentary: null,
      });
      return;
    }

    const client = getGeminiClient();
    if (!client) {
      // Gemini unconfigured; client seamlessly uses local fallback
      res.status(200).json({
        commentary: null,
        fallbackUsed: true,
        reason: 'Gemini API key not configured.',
      });
      return;
    }

    const safeLabel =
      typeof participantLabel === 'string' && participantLabel.trim()
        ? participantLabel.trim().slice(0, 40)
        : 'Anonymous';

    const modeTitle = mode === 'full' ? 'Full Challenge' : 'Quick Play';

    const prompt = `You are a witty, warm commentator for a lighthearted social friendship quiz called 'Do You Really Know Forsyth?'.
Write a 1-2 sentence playful, humorous reaction to the participant's score.
The participant is: "${safeLabel}".
They scored ${score}% (${correctCount} of ${totalQuestions} correct) in ${modeTitle} mode, earning the tier: "${tier}".

Strict Constraints:
- Keep it friendly, positive, and playful.
- Maximum 2 sentences (strictly under 180 characters total).
- Never insult the participant, make sensitive personal inferences, or make romantic claims.
- If the participant is "Anonymous", address them as a mysterious friend or secret acquaintance without guessing who they are.
- Never recalculate or dispute the score or tier.
- Return ONLY the commentary text, with no quotes, markdown formatting, or preamble.`;

    const generateCommentary = async () => {
      const models = ['gemini-3.6-flash', 'gemini-3.8-flash'];
      let lastErr: any = null;
      for (const model of models) {
        try {
          const apiRes = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
              maxOutputTokens: 250,
              temperature: 0.7,
              thinkingConfig: {
                thinkingLevel: 'minimal' as any,
              },
            },
          });
          const text =
            apiRes.text ||
            apiRes.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text ||
            '';
          if (text && text.trim().length >= 10) {
            return text;
          }
        } catch (e: any) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
      return '';
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini call timed out after 6000ms')), 6000),
    );

    const rawText = await Promise.race([generateCommentary(), timeoutPromise]);

    const cleanCommentary = (rawText || '')
      .trim()
      .replace(/^["'“”]+|["'“”]+$/g, '')
      .trim();

    if (!cleanCommentary || cleanCommentary.length < 10) {
      res.status(200).json({
        commentary: null,
        fallbackUsed: true,
        reason: 'Generated content too short.',
      });
      return;
    }

    res.status(200).json({
      commentary: cleanCommentary,
      fallbackUsed: false,
    });
  } catch (err: any) {
    console.info('Gemini commentary fallback engaged:', err?.message || err);
    res.status(200).json({
      commentary: null,
      fallbackUsed: true,
      reason: 'Gemini service encountered an error or quota limit.',
    });
  }
}
