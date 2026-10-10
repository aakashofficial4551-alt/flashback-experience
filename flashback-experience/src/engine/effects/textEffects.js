// TEXT effects. Signature: (target, intensity, { duration, refs }) => tween / timeline.
// `target` is one cue element. Every word has class .w and every letter has class .c (see TextLayer).
// textEffects = entrances, textExits = exits. Only transform / opacity (and short blur) are animated.
import gsap from 'gsap';
import { fx, LATER, jitterFrames, rng } from './helpers.js';

const letters = (el) => el.querySelectorAll('.c');
const words = (el) => el.querySelectorAll('.w');

// ---------------- entrances ----------------
export const fade = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration, ease: 'power1.out', ...LATER }), 1.4);

export const scaleBurst = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 0, scale: 1 + 0.7 * k }, { opacity: 1, scale: 1, duration, ease: 'power4.out', ...LATER }), 0.7);

export const blurToSharp = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 0, filter: `blur(${14 * k}px)` },
    { opacity: 1, filter: 'blur(0px)', duration, ease: 'power2.out', clearProps: 'filter', ...LATER }), 1.8);

export const suddenAppear = fx((el) =>
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: 'none', ...LATER }), 0.001);

export const cinematicReveal = fx((el, k, { duration }) => {
  const w = words(el);
  const span = duration * 0.55;
  return gsap.fromTo(w, { opacity: 0, y: '0.4em', filter: 'blur(6px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: duration - span, stagger: span / Math.max(1, w.length), ease: 'power2.out', clearProps: 'filter', ...LATER });
}, 2.6);

export const typeOn = fx((el, k, { duration }) => {
  const c = letters(el);
  return gsap.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.001, stagger: duration / Math.max(1, c.length), ease: 'none', ...LATER });
}, 1.6);

// Letters start bunched toward the middle and spread out to their normal places.
export const letterSpacing = fx((el, k, { duration }) =>
  gsap.fromTo(letters(el),
    { opacity: 0, x: (i, _t, list) => ((list.length - 1) / 2 - i) * 0.45 * k * (parseFloat(getComputedStyle(el).fontSize) || 20) * 0.5 },
    { opacity: 1, x: 0, duration, ease: 'power3.out', ...LATER }), 2.2);

export const shake = fx((el, k, { duration }) =>
  gsap.timeline()
    .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.05, ease: 'none', ...LATER }, 0)
    .to(el, { keyframes: jitterFrames({ seed: 3, amp: 10 * k, rot: 0.8 * k, duration }), ...LATER }, 0), 0.7);

export const glitch = fx((el, k, { duration, refs }) => {
  const r = rng(9);
  const n = 8, each = duration / (n + 1);
  const frames = Array.from({ length: n }, () => ({
    x: (r() * 2 - 1) * 14 * k, skewX: (r() * 2 - 1) * 10 * k, opacity: r() > 0.7 ? 0.4 : 1, duration: each, ease: 'steps(1)',
  }));
  frames.push({ x: 0, skewX: 0, opacity: 1, duration: each, ease: 'none' });
  const tl = gsap.timeline();
  tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none', ...LATER }, 0);
  tl.to(el, { keyframes: frames, ...LATER }, 0);
  if (refs?.root) {
    tl.fromTo(refs.root, { '--split': 0 }, { '--split': 6 * k, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', ...LATER }, 0);
  }
  return tl;
}, 0.6);

export const distortion = fx((el, k, { duration }) => {
  const d = duration / 4;
  return gsap.timeline()
    .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, ...LATER }, 0)
    .to(el, {
      keyframes: [
        { skewX: 12 * k, duration: d, ease: 'power2.out' }, { skewX: -9 * k, duration: d, ease: 'sine.inOut' },
        { skewX: 4 * k, duration: d, ease: 'sine.inOut' }, { skewX: 0, duration: d, ease: 'power2.out' },
      ], ...LATER,
    }, 0);
}, 1.2);

// ---------------- exits ----------------
export const textExits = {
  fade: fx((el, k, { duration }) =>
    gsap.fromTo(el, { opacity: 1 }, { opacity: 0, duration, ease: 'power1.in', ...LATER }), 0.9),

  blurOut: fx((el, k, { duration }) =>
    gsap.fromTo(el, { opacity: 1, filter: 'blur(0px)' },
      { opacity: 0, filter: `blur(${12 * k}px)`, duration, ease: 'power2.in', clearProps: 'filter', ...LATER }), 1),

  cut: fx((el) => gsap.fromTo(el, { opacity: 1 }, { opacity: 0, duration: 0.001, ease: 'none', ...LATER }), 0.001),

  dissolve: fx((el, k, { duration }) => {
    const c = letters(el);
    return gsap.fromTo(c, { opacity: 1 },
      { opacity: 0, duration: duration * 0.5, stagger: { each: (duration * 0.5) / Math.max(1, c.length), from: 'random' }, ease: 'none', ...LATER });
  }, 1.4),
};

export const textEffects = { fade, scaleBurst, blurToSharp, suddenAppear, cinematicReveal, typeOn, letterSpacing, shake, glitch, distortion };
