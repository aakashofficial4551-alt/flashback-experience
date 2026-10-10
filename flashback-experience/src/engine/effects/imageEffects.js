// IMAGE effects. Signature: (target, intensity, { duration, refs }) => GSAP tween (or timeline).
// `target` is the image slot element. `intensity` is 1 for normal strength.
// Animate transform / opacity only (GPU friendly). Two effects that change the SAME
// property at the same time (for example two scale effects) will fight each other.
import gsap from 'gsap';
import { fx, LATER, jitterFrames, rng } from './helpers.js';
import { burn, crack } from './destroyEffects.js';

// ----- entrances -----
export const fade = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration, ease: 'power1.out', ...LATER }), 1.5);

export const suddenReveal = fx((el, k, { duration }) =>
  gsap.timeline()
    .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none', ...LATER }, 0)
    .fromTo(el, { scale: 1 + 0.08 * k }, { scale: 1, duration, ease: 'power4.out', ...LATER }, 0), 0.9);

export const blurIn = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 0, filter: `blur(${18 * k}px)` },
    { opacity: 1, filter: 'blur(0px)', duration, ease: 'power2.out', clearProps: 'filter', ...LATER }), 2);

// ----- exits -----
export const fadeOut = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 1 }, { opacity: 0, duration, ease: 'power1.in', ...LATER }), 1.2);

export const darkFade = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 1 }, { opacity: 0, duration, ease: 'power3.in', ...LATER }), 2.2);

export const blurOut = fx((el, k, { duration }) =>
  gsap.fromTo(el, { opacity: 1, filter: 'blur(0px)' },
    { opacity: 0, filter: `blur(${18 * k}px)`, duration, ease: 'power2.in', clearProps: 'filter', ...LATER }), 1.4);

// Hard cut: the image is gone at the end of its scene, nothing animated.
export const cut = fx((el) =>
  gsap.fromTo(el, { opacity: 1 }, { opacity: 0, duration: 0.001, ease: 'none', ...LATER }), 0.001);

// ----- camera moves (hold for the whole scene by default) -----
export const zoomIn = fx((el, k, { duration }) =>
  gsap.fromTo(el, { scale: 1 }, { scale: 1 + 0.25 * k, duration, ease: 'power2.inOut', ...LATER }), 3);

export const zoomOut = fx((el, k, { duration }) =>
  gsap.fromTo(el, { scale: 1 + 0.25 * k }, { scale: 1, duration, ease: 'power2.inOut', ...LATER }), 3);

export const slowZoom = fx((el, k, { duration }) =>
  gsap.fromTo(el, { scale: 1 }, { scale: 1 + 0.12 * k, duration, ease: 'none', ...LATER }), null);

export const drift = fx((el, k, { duration }) =>
  gsap.fromTo(el, { scale: 1.06, xPercent: -1.5 * k }, { scale: 1.08, xPercent: 1.5 * k, duration, ease: 'none', ...LATER }), null);

export const rotate = fx((el, k, { duration }) =>
  gsap.fromTo(el, { rotation: 0 }, { rotation: 3 * k, duration, ease: 'power2.inOut', ...LATER }), 3);

// ----- impacts -----
export const shake = fx((el, k, { duration }) =>
  gsap.to(el, { keyframes: jitterFrames({ seed: 11, amp: 18 * k, rot: 0.7 * k, duration }), ...LATER }), 0.6);

export const distortion = fx((el, k, { duration }) => {
  const d = duration / 5;
  return gsap.to(el, {
    keyframes: [
      { skewX: 5 * k, skewY: 1.2 * k, duration: d, ease: 'power2.out' },
      { skewX: -4 * k, skewY: -1 * k, duration: d, ease: 'sine.inOut' },
      { skewX: 2.5 * k, skewY: 0.6 * k, duration: d, ease: 'sine.inOut' },
      { skewX: -1 * k, skewY: 0, duration: d, ease: 'sine.inOut' },
      { skewX: 0, skewY: 0, duration: d, ease: 'power2.out' },
    ],
    ...LATER,
  });
}, 1.2);

export const glitch = fx((el, k, { duration }) => {
  const r = rng(5);
  const n = 7, each = duration / (n + 1);
  const frames = Array.from({ length: n }, () => ({
    x: (r() * 2 - 1) * 24 * k, skewX: (r() * 2 - 1) * 6 * k, opacity: r() > 0.72 ? 0.55 : 1,
    duration: each, ease: 'steps(1)',
  }));
  frames.push({ x: 0, skewX: 0, opacity: 1, duration: each, ease: 'none' });
  return gsap.to(el, { keyframes: frames, ...LATER });
}, 0.5);

export const flash = fx((el, k, { duration }) =>
  gsap.fromTo(el, { filter: `brightness(${1 + 2.5 * k})` },
    { filter: 'brightness(1)', duration, ease: 'power2.out', clearProps: 'filter', ...LATER }), 0.6);

export const blur = fx((el, k, { duration }) =>
  gsap.fromTo(el, { filter: 'blur(0px)' },
    { filter: `blur(${10 * k}px)`, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', clearProps: 'filter', ...LATER }), 1.2);

// Chromatic aberration: splits the picture into red / green / blue copies for a moment.
// The three copies are created only while the effect runs, so it costs nothing otherwise.
export const chromatic = fx((el, k, { duration }) => {
  const px = 7 * k;
  const state = { p: 0 };
  let layers = [];

  const hide = () => {
    el.querySelectorAll('.chroma-ch').forEach((n) => n.remove());
    el.querySelectorAll('img').forEach((i) => { i.style.visibility = ''; });
    layers = [];
  };
  const show = () => {
    hide();
    const img = el.querySelector('img');
    if (!img) return;
    layers = ['#ff0000', '#00ff00', '#0000ff'].map((color) => {
      const box = document.createElement('div');
      box.className = 'chroma-ch';
      box.style.backgroundColor = color;
      const copy = img.cloneNode();
      copy.classList.add('chroma-img');
      copy.setAttribute('aria-hidden', 'true');
      box.append(copy);
      return box;
    });
    el.append(...layers);
    img.style.visibility = 'hidden';
  };
  const update = () => {
    if (!layers.length) return;
    layers[0].style.transform = `translate3d(${-px * state.p}px,0,0)`;
    layers[2].style.transform = `translate3d(${px * state.p}px,0,0)`;
  };

  return gsap.to(state, {
    p: 1, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut',
    onStart: show, onUpdate: update, onComplete: hide, onReverseComplete: hide, ...LATER,
  });
}, 0.5);

// ----- destroy effects (purely visual overlays, the original image is never touched) -----
export { burn, crack };
