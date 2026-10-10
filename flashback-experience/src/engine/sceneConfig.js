// Turns the friendly config in src/data/scenes.js into one strict, fully-filled shape the engine can trust.
// Beginners can write "shake: 3" or "shake: { at: 3, intensity: 2 }" or a list; this file accepts all of them.
import { resolveMedia } from '../utils/url.js';

export const LEAD = 0.05; // tiny silent lead-in so the very first cue is never skipped

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const num = (v, d) => (isNum(v) ? v : d);
const list = (v) => (v == null || v === false ? [] : Array.isArray(v) ? v : [v]);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

// "fade" | { effect: 'fade', duration: 2 } | undefined  ->  { effect, duration? } | null
function effectSpec(v, fallback) {
  const raw = v === undefined ? fallback : v;
  if (!raw) return null;
  if (typeof raw === 'string') return { effect: raw };
  const o = obj(raw);
  return o ? { ...o, effect: o.effect || o.name || fallback } : null;
}

// 3 | { at: 3 } | [3, 5] | [{ at: 3 }]  ->  [{ at, ... }]
function timedList(v, defaults = {}) {
  return list(v).map((item) => (isNum(item) ? { ...defaults, at: item } : { ...defaults, ...obj(item) })).filter((x) => isNum(x.at));
}

// 12 | { from, to, at, duration } -> { from, to, at, duration|null }
function ramp(v, { staticFrom = 0 } = {}) {
  if (v == null || v === false) return null;
  if (isNum(v)) return { from: staticFrom, to: v, at: 0, duration: null, isStatic: true };
  const o = obj(v);
  if (!o) return null;
  return { from: num(o.from, staticFrom), to: num(o.to, 0), at: num(o.at, 0), duration: isNum(o.duration) ? o.duration : null };
}

function normalizeAudioRef(v, base, extra = {}) {
  if (!v) return null;
  const o = typeof v === 'string' ? { src: v } : obj(v);
  const src = resolveMedia(o?.src || o?.url, base);
  return src ? { at: 0, volume: 1, ...extra, ...o, src } : null;
}

function normalizeText(raw, scene, base) {
  let cursor = 0.8;
  return list(raw.text).map((item, n) => {
    const o = typeof item === 'string' ? { text: item } : obj(item) || {};
    const at = num(o.at, cursor);
    const natural = Math.max(1.5, raw.duration - 0.8 - at);
    const duration = num(o.duration, natural);
    cursor = at + duration + 0.4;
    return {
      id: `${scene.id}-t${n}`,
      text: String(o.text ?? ''),
      at,
      duration,
      style: o.style || raw.textStyle || 'caption',
      position: o.position || 'center',
      effect: o.effect || 'fade',
      inDuration: o.inDuration,
      exit: o.exit || 'fade',
      outDuration: o.outDuration,
    };
  }).filter((c) => c.text);
}

function normalizeVibration(v) {
  if (v == null || v === false) return [];
  if (isNum(v)) return [{ at: 0, pattern: v }];
  if (Array.isArray(v) && v.every(isNum)) return [{ at: 0, pattern: v }];
  return list(v).map((x) => ({ at: num(x?.at, 0), pattern: x?.pattern })).filter((x) => x.pattern != null);
}

export function normalizeScenes(rawScenes = [], settings = {}) {
  const base = settings.mediaBase || '';
  let cursor = LEAD;

  return rawScenes.map((raw, index) => {
    const id = raw.id || `scene-${String(index + 1).padStart(2, '0')}`;
    const duration = Math.max(0.5, num(raw.duration, 8));
    const delay = Math.max(0, num(raw.delay, 0));
    const start = cursor;
    const visualStart = start + delay;
    const end = visualStart + duration;
    cursor = end;

    const imageSrc = resolveMedia(raw.image, base);
    const overlay = typeof raw.overlay === 'string' ? { color: raw.overlay, opacity: 0.3 } : obj(raw.overlay);

    const scene = {
      id, index, duration, delay, start, visualStart, end,
      background: raw.background || '#050506',
      intensity: num(raw.intensity, 1),
      volume: num(raw.volume, 1),

      image: imageSrc ? { src: imageSrc, position: raw.imagePosition || 'center', fit: raw.imageFit || 'cover' } : null,
      entrance: effectSpec(raw.entranceEffect, 'fade'),
      exit: effectSpec(raw.exitEffect, 'fadeOut'),
      imageEffects: list(raw.imageEffect).map((e) => effectSpec(e)).filter(Boolean),

      overlay: overlay ? { color: overlay.color || '#000', opacity: num(overlay.opacity, 0.3) } : null,
      darkness: ramp(raw.darkness),
      blur: ramp(raw.blur),
      zoom: (() => {
        const z = ramp(raw.zoom, { staticFrom: 1 });
        return z && isNum(raw.zoom) ? { ...z, isStatic: false } : z;
      })(),
      rotation: (() => {
        const r = ramp(raw.rotation);
        return r && isNum(raw.rotation) ? { ...r, isStatic: false } : r;
      })(),

      // One list for everything that fires at a moment in time.
      timed: [
        ...timedList(raw.shake).map((e) => ({ effect: 'cameraShake', ...e, ...(e.target === 'image' ? { effect: 'shake' } : {}) })),
        ...timedList(raw.glitch).map((e) => ({ effect: 'glitch', ...e })),
        ...timedList(raw.flash).map((e) => ({ effect: 'flash', ...e })),
        ...timedList(raw.effects).map((e) => ({ ...e, effect: e.effect || e.name })),
      ],
      custom: list(raw.custom).map((c) => (typeof c === 'string' ? { name: c, at: 0 } : { name: c.name, at: num(c.at, 0) })).filter((c) => c.name),

      voice: normalizeAudioRef(raw.voice, base),
      ambience: raw.ambience === undefined ? undefined : (normalizeAudioRef(raw.ambience, base, { volume: 1, fadeIn: 2, fadeOut: 2 }) || null),
      soundEffects: list(raw.soundEffects).map((s) => normalizeAudioRef(s, base)).filter(Boolean),
      vibration: normalizeVibration(raw.vibration),
    };

    scene.texts = normalizeText({ ...raw, duration }, scene, base);
    return scene;
  });
}
