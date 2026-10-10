// Loads the pictures and sounds of a scene. Only the CURRENT and the NEXT scene are kept in memory;
// everything older is released. A broken file never throws: the entry just becomes "ready without it".
import { withTimeout } from '../utils/async.js';

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve({ el: null, ok: false });
    const el = new Image();
    el.decoding = 'async';
    el.alt = '';
    el.draggable = false;
    el.onload = async () => {
      try { await el.decode?.(); } catch { /* still usable */ }
      resolve({ el, ok: true });
    };
    el.onerror = () => {
      console.warn(`[media] Could not load image ${src}. A dark fallback is shown instead.`);
      resolve({ el: null, ok: false });
    };
    el.src = src;
  });
}

export const audioUrlsOf = (scene) => [
  scene.voice?.src,
  scene.ambience?.src,
  ...scene.soundEffects.map((s) => s.src),
].filter(Boolean);

export class MediaLoader {
  constructor({ scenes, audio, timeoutMs = 12000 }) {
    this.scenes = scenes;
    this.audio = audio;
    this.timeoutMs = timeoutMs;
    this.entries = new Map(); // sceneIndex -> { image, ready, promise }
  }

  prepare(index) {
    const scene = this.scenes[index];
    if (!scene) return Promise.resolve();
    const known = this.entries.get(index);
    if (known) return known.promise;
    const entry = { image: null, ready: false, promise: null };
    entry.promise = Promise.all([
      loadImage(scene.image?.src).then((r) => { entry.image = r; }),
      ...audioUrlsOf(scene).map((u) => this.audio.load(u)),
    ]).then(() => { entry.ready = true; });
    this.entries.set(index, entry);
    return entry.promise;
  }

  isReady(index) { return !this.scenes[index] || Boolean(this.entries.get(index)?.ready); }

  whenReady(index, ms = this.timeoutMs) {
    return withTimeout(this.prepare(index), ms);
  }

  getImage(index) { return this.entries.get(index)?.image?.el || null; }

  // Keep scene `index` and the next one, load whatever is missing, release the rest.
  focus(index) {
    const keep = [index, index + 1].filter((i) => this.scenes[i]);
    for (const i of [...this.entries.keys()]) if (!keep.includes(i)) this.entries.delete(i);
    this.audio.retain(keep.flatMap((i) => audioUrlsOf(this.scenes[i])));
    keep.forEach((i) => this.prepare(i));
  }

  // Used before START: first two scenes, but never wait forever.
  preloadInitial() {
    this.focus(0);
    return withTimeout(Promise.all([this.prepare(0), this.prepare(1)]), this.timeoutMs);
  }

  dispose() { this.entries.clear(); }
}
