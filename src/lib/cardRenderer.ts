/**
 * Card Renderer Utility
 * 
 * Draws a high-DPI shareable result card to an HTML Canvas and exports it as a PNG.
 * Contains strictly:
 * - "Do You Really Know Forsyth?"
 * - Participant name or "Anonymous"
 * - Quick Play or Full Challenge
 * - Percentage score & correct count
 * - Result tier title
 * - Playful reaction
 * - "Think you know Forsyth better? Take the challenge."
 * 
 * Excludes individual answers, Honest Room responses, IDs, timestamps, and admin data.
 */

export interface CardRenderData {
  participantLabel: string;
  mode: 'quick' | 'full';
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  tierTitle: string;
  reaction: string;
}

export async function renderResultCardToCanvas(data: CardRenderData): Promise<HTMLCanvasElement> {
  const width = 1200;
  const height = 675; // Standard 16:9 social landscape

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  // 1. Background: Deep rich midnight slate/navy gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#090D16');
  bgGradient.addColorStop(0.5, '#0F172A');
  bgGradient.addColorStop(1, '#1E293B');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative geometric accents
  // Top right subtle gold aura
  const auraGold = ctx.createRadialGradient(width - 150, 100, 10, width - 150, 100, 450);
  auraGold.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
  auraGold.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = auraGold;
  ctx.fillRect(0, 0, width, height);

  // Bottom left subtle blue aura
  const auraBlue = ctx.createRadialGradient(150, height - 100, 10, 150, height - 100, 450);
  auraBlue.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
  auraBlue.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = auraBlue;
  ctx.fillRect(0, 0, width, height);

  // 3. Card Inner Border & Frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  const pad = 40;
  const r = 32;
  ctx.beginPath();
  ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, r);
  ctx.stroke();

  // 4. Brand Eyebrow / Title
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.letterSpacing = '2px';
  ctx.fillText('THE OFFICIAL FRIENDSHIP TEST', pad + 50, pad + 65);

  ctx.font = '900 52px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.letterSpacing = '-1px';
  ctx.fillText('Do You Really Know Forsyth?', pad + 50, pad + 125);

  // 5. Mode & Participant Badges
  const modeText = data.mode === 'full' ? 'FULL CHALLENGE' : 'QUICK PLAY';
  const participantText = data.participantLabel || 'Anonymous';

  // Badge 1: Mode
  ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
  ctx.beginPath();
  ctx.roundRect(pad + 50, pad + 155, 180, 36, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#93C5FD';
  ctx.fillText(modeText, pad + 75, pad + 179);

  // Badge 2: Participant Name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(pad + 245, pad + 155, 260, 36, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.stroke();

  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#E2E8F0';
  const truncatedName = participantText.length > 20 ? participantText.slice(0, 18) + '...' : participantText;
  ctx.fillText(`Player: ${truncatedName}`, pad + 265, pad + 179);

  // 6. Center Hero: Percentage Score & Correct Count
  // Big score number
  ctx.font = '900 130px system-ui, -apple-system, sans-serif';
  const scoreText = `${data.scorePercentage}%`;
  ctx.fillStyle = '#F59E0B'; // Forsyth Gold
  ctx.fillText(scoreText, pad + 50, pad + 320);

  // Correct count next to score
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#CBD5E1';
  ctx.fillText(
    `${data.correctCount} of ${data.totalQuestions} questions correct`,
    pad + 50,
    pad + 365,
  );

  // 7. Result Tier Box
  const tierBoxY = pad + 225;
  const tierBoxX = width - pad - 480;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.beginPath();
  ctx.roundRect(tierBoxX, tierBoxY, 430, 150, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FBBF24';
  ctx.letterSpacing = '1px';
  ctx.fillText('RESULT TIER', tierBoxX + 30, tierBoxY + 45);

  ctx.font = '800 32px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(data.tierTitle, tierBoxX + 30, tierBoxY + 95);

  // 8. Playful Reaction Box
  const reactionY = pad + 410;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  ctx.roundRect(pad + 50, reactionY, width - pad * 2 - 100, 85, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'italic 19px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#E2E8F0';
  
  // Wrap text cleanly if longer than ~80 chars
  const maxLineLength = 85;
  const cleanReaction = data.reaction.replace(/^["'“”]+|["'“”]+$/g, '');
  if (cleanReaction.length > maxLineLength) {
    const splitIndex = cleanReaction.lastIndexOf(' ', maxLineLength);
    const line1 = cleanReaction.slice(0, splitIndex);
    const line2 = cleanReaction.slice(splitIndex + 1);
    ctx.fillText(`“${line1}`, pad + 75, reactionY + 36);
    ctx.fillText(`${line2}”`, pad + 75, reactionY + 65);
  } else {
    ctx.fillText(`“${cleanReaction}”`, pad + 75, reactionY + 48);
  }

  // 9. Footer Invitation: "Think you know Forsyth better? Take the challenge."
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#38BDF8'; // Sky blue
  const footerText = '👉 Think you know Forsyth better? Take the challenge.';
  ctx.fillText(footerText, pad + 50, height - pad - 35);

  return canvas;
}

/**
 * Generates PNG data URL and triggers browser file download.
 */
export async function downloadResultCardPng(data: CardRenderData, filename = 'forsyth-quiz-result.png'): Promise<void> {
  const canvas = await renderResultCardToCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
