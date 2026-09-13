/**
 * Confetti Celebration Utility
 * 
 * Provides restrained celebratory particle effects for high scores (71%+).
 * - Automatically respects window.matchMedia('(prefers-reduced-motion: reduce)')
 * - Styled with the app's navy, blue, gold, and crimson palette.
 * - Non-intrusive, auto-cleans up after 3 seconds.
 */

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export function launchConfetti(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  // Suppress if user has enabled reduced-motion settings
  if (isReducedMotionPreferred()) {
    return () => {};
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'celebration-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return () => {};
  }

  const updateDimensions = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  updateDimensions();

  // Color palette: Gold, Blue, Crimson, Navy, Amber
  const colors = ['#F59E0B', '#3B82F6', '#EF4444', '#1E3A8A', '#FCD34D', '#EC4899', '#10B981'];

  const particles: Particle[] = [];
  const particleCount = 48; // Restrained count to maintain performance and avoid excessive clutter

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35 + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();
  const duration = 2800; // 2.8 seconds total duration

  const render = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      cleanup();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fadeOut = elapsed > duration - 800 ? (duration - elapsed) / 800 : 1;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.vx *= 0.98; // Air drag
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity * fadeOut);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  };

  animationFrameId = requestAnimationFrame(render);

  const cleanup = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };

  return cleanup;
}
