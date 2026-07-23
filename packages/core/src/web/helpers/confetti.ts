import confetti from 'canvas-confetti';

export const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORS = ['#52c41a', '#16a1a1', '#faad14', '#ff7a45', '#9254de', '#36cfc9'];

/** Rains confetti from the top of the viewport (machine-health celebration). */
export const rainConfetti = (): void => {
  if (prefersReducedMotion()) return;

  const end = Date.now() + 900;

  const frame = (): void => {
    confetti({
      colors: COLORS,
      origin: { x: Math.random(), y: -0.1 },
      particleCount: 6,
      spread: 90,
      startVelocity: 25,
      ticks: 260,
      zIndex: 10000,
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
};

/** Bursts a small confetti pop from a point (per-task mark-done feedback). */
export const popConfetti = (x: number, y: number): void => {
  if (prefersReducedMotion()) return;

  confetti({
    colors: COLORS,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    particleCount: 40,
    scalar: 0.9,
    spread: 70,
    startVelocity: 32,
    ticks: 120,
    zIndex: 10000,
  });
};
