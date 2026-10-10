// SCREEN effects. Signature: (refs, intensity, { duration }) => tween / timeline.
// For these, the first argument is the object of named stage elements (see SceneRenderer):
// refs.camera, refs.flash, refs.blackout, refs.vignette, refs.slot, refs.root ...
import gsap from 'gsap';
import { fx, LATER, jitterFrames } from './helpers.js';
import { glitch as imageGlitch, chromatic as imageChromatic } from './imageEffects.js';

const GRAIN_BASE = 0.09; // keep in sync with .grain opacity in global.css

export const flash = fx((refs, k, { duration }) =>
  gsap.fromTo(refs.flash, { opacity: Math.min(1, 0.5 + 0.4 * k) }, { opacity: 0, duration, ease: 'power2.out', ...LATER }), 0.7);

export const blackout = fx((refs, k, { duration }) =>
  gsap.fromTo(refs.blackout, { opacity: 0 }, { opacity: 1, duration, ease: 'power2.in', ...LATER }), 0.8);

export const unblack = fx((refs, k, { duration }) =>
  gsap.fromTo(refs.blackout, { opacity: 1 }, { opacity: 0, duration, ease: 'power2.out', ...LATER }), 1.2);

export const vignettePulse = fx((refs, k, { duration }) =>
  gsap.fromTo(refs.vignette, { opacity: 0 },
    { opacity: Math.min(1, 0.85 * k), duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', ...LATER }), 2);

export const grainBurst = fx((refs, k, { duration }) =>
  gsap.fromTo(document.documentElement, { '--grain': GRAIN_BASE + 0.3 * k }, { '--grain': GRAIN_BASE, duration, ease: 'power2.out', ...LATER }), 1.2);

export const screenBlur = fx((refs, k, { duration }) =>
  gsap.fromTo(refs.camera, { filter: 'blur(0px)' },
    { filter: `blur(${8 * k}px)`, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', clearProps: 'filter', ...LATER }), 1.2);

export const cameraShake = fx((refs, k, { duration }) =>
  gsap.to(refs.camera, { keyframes: jitterFrames({ seed: 3, steps: 12, amp: 16 * k, rot: 0.5 * k, duration }), ...LATER }), 0.6);

export const screenDistortion = fx((refs, k, { duration }) => {
  const d = duration / 4;
  return gsap.to(refs.camera, {
    keyframes: [
      { skewX: 3 * k, duration: d, ease: 'power2.out' }, { skewX: -2.5 * k, duration: d, ease: 'sine.inOut' },
      { skewX: 1 * k, duration: d, ease: 'sine.inOut' }, { skewX: 0, duration: d, ease: 'power2.out' },
    ], ...LATER,
  });
}, 1);

// Picture glitch + red/blue split on the text, together.
export const glitch = fx((refs, k, { duration }) => {
  const tl = gsap.timeline();
  tl.add(imageGlitch(refs.slot, k, { duration }), 0);
  tl.fromTo(refs.root, { '--split': 0 }, { '--split': 6 * k, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', ...LATER }, 0);
  return tl;
}, 0.5);

// Chromatic aberration on picture and text.
export const chromatic = fx((refs, k, { duration }) => {
  const tl = gsap.timeline();
  tl.add(imageChromatic(refs.slot, k, { duration }), 0);
  tl.fromTo(refs.root, { '--split': 0 }, { '--split': 5 * k, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', ...LATER }, 0);
  return tl;
}, 0.6);

// Noise: heavy grain plus a quick brightness flicker of the whole picture.
export const noise = fx((refs, k, { duration }) => {
  const tl = gsap.timeline();
  tl.add(grainBurst(refs, k * 1.4, { duration }), 0);
  tl.fromTo(refs.camera, { opacity: 0.78 }, { opacity: 1, duration: duration * 0.6, ease: 'steps(5)', ...LATER }, 0);
  return tl;
}, 0.9);

export const screenEffects = {
  flash, blackout, unblack, vignettePulse, grainBurst, screenBlur, cameraShake,
  screenDistortion, glitch, chromatic, noise,
};
