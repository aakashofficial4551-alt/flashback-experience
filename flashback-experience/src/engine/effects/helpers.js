// Small helpers shared by all effects.

// Marks a function as an effect and records its default duration (seconds).
// duration = null means "stretch over the whole scene" (used by slow camera moves).
export const fx = (fn, duration = 1) => Object.assign(fn, { duration });

// Do not apply the "from" values when the timeline is BUILT, only when the effect is reached.
export const LATER = { immediateRender: false };

// Tiny seeded random generator: the same shake looks the same on every play.
export function rng(seed = 1) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Decaying random jolts that always end exactly at rest (x = y = rotation = 0).
export function jitterFrames({ seed = 1, steps = 10, amp = 14, rot = 0, duration = 0.6, skew = 0 }) {
  const r = rng(seed);
  const each = duration / (steps + 1);
  const frames = [];
  for (let i = 0; i < steps; i++) {
    const decay = 1 - i / steps;
    frames.push({
      x: (r() * 2 - 1) * amp * decay,
      y: (r() * 2 - 1) * amp * 0.6 * decay,
      rotation: (r() * 2 - 1) * rot * decay,
      skewX: (r() * 2 - 1) * skew * decay,
      duration: each,
      ease: 'none',
    });
  }
  frames.push({ x: 0, y: 0, rotation: 0, skewX: 0, duration: each, ease: 'power2.out' });
  return frames;
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
