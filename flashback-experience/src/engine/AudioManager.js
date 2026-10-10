// One place for all sound: voice, sound effects, ambience. Built on the Web Audio API so that
// everything shares ONE clock (ctx.currentTime):
//   * the GSAP master timeline decides WHEN each sound starts (play() is called from timeline cues),
//   * pausing the timeline also suspends the AudioContext, so all layers stop and resume together,
//   * a missing or broken file simply plays nothing (the visuals never wait for it).
import { withTimeout } from '../utils/async.js';

const BUSES = ['voice', 'sfx', 'ambience'];

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.buses = {};
    this.entries = new Map();   // url -> { promise, buffer, settled }
    this.active = new Set();    // currently playing { src, gain, group, sceneIndex, url }
    this.ambience = null;
    this.muted = false;
    this.listeners = new Set();
    this._onState = () => this.listeners.forEach((fn) => fn(this.ctx?.state));
  }

  get available() {
    return typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
  }

  // Creates the AudioContext (it may start "suspended" until unlock() runs inside a click).
  init() {
    if (this.ctx || !this.available) return this.ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ latencyHint: 'interactive' });
    } catch { this.ctx = null; return null; }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    for (const name of BUSES) {
      const bus = this.ctx.createGain();
      bus.connect(this.master);
      this.buses[name] = bus;
    }
    this.ctx.addEventListener('statechange', this._onState);
    return this.ctx;
  }

  // MUST be called synchronously inside a click/tap handler (before any await).
  unlock() {
    const ctx = this.init();
    if (!ctx) return;
    try {
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      const s = ctx.createBufferSource();      // one silent sample finishes the unlock on iOS Safari
      s.buffer = ctx.createBuffer(1, 1, 22050);
      s.connect(ctx.destination);
      s.start(0);
    } catch { /* silent */ }
  }

  onStateChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ---------- loading ----------
  // Resolves with the decoded AudioBuffer, or null if anything goes wrong. Never rejects.
  load(url) {
    if (!url) return Promise.resolve(null);
    const known = this.entries.get(url);
    if (known) return known.promise;
    const ctx = this.init();
    if (!ctx) return Promise.resolve(null);
    const entry = { buffer: null, settled: false, promise: null };
    entry.promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        entry.buffer = await ctx.decodeAudioData(await res.arrayBuffer());
      } catch (err) {
        console.warn(`[audio] Could not load ${url}: ${err?.message || err}. The scene continues silently.`);
      }
      entry.settled = true;
      return entry.buffer;
    })();
    this.entries.set(url, entry);
    return entry.promise;
  }

  // Frees decoded audio for every file NOT in `urls` (except the ambience that is playing).
  retain(urls) {
    const keep = new Set(urls);
    if (this.ambience) keep.add(this.ambience.url);
    for (const url of [...this.entries.keys()]) if (!keep.has(url)) this.entries.delete(url);
  }

  // ---------- playing ----------
  play({ url, group = 'sfx', volume = 1, loop = false, fadeIn = 0, sceneIndex = -1 }) {
    const buffer = this.entries.get(url)?.buffer;
    if (!this.ctx || !buffer) return null;
    try {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = loop;
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      if (fadeIn > 0) {
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(volume, now + fadeIn);
      } else gain.gain.setValueAtTime(volume, now);
      src.connect(gain).connect(this.buses[group] || this.master);
      const voice = { src, gain, group, sceneIndex, url };
      this.active.add(voice);
      src.onended = () => {
        this.active.delete(voice);
        try { src.disconnect(); gain.disconnect(); } catch { /* already gone */ }
      };
      src.start(now);
      return voice;
    } catch (err) {
      console.warn('[audio] play failed', err);
      return null;
    }
  }

  _fadeStop(voice, fade) {
    try {
      const now = this.ctx.currentTime;
      const t = Math.max(fade, 0.02);
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.linearRampToValueAtTime(0, now + t);
      voice.src.stop(now + t + 0.03);
    } catch { /* already stopped */ }
  }

  // Voice + sound effects of one scene (ambience is handled separately so it can carry over).
  stopScene(sceneIndex, fade = 0.25) {
    this.active.forEach((v) => { if (v.sceneIndex === sceneIndex && v.group !== 'ambience') this._fadeStop(v, fade); });
  }

  stopAll(fade = 0.2) {
    this.active.forEach((v) => this._fadeStop(v, fade));
    this.ambience = null;
  }

  // Keeps playing if the same file is already the ambience (just changes its volume).
  setAmbience({ url, volume = 1, fadeIn = 2, fadeOut = 2 }) {
    if (!this.ctx) return;
    const cur = this.ambience;
    if (cur && cur.url === url) {
      const now = this.ctx.currentTime;
      cur.gain.gain.cancelScheduledValues(now);
      cur.gain.gain.setValueAtTime(cur.gain.gain.value, now);
      cur.gain.gain.linearRampToValueAtTime(volume, now + Math.max(fadeIn, 0.05));
      return;
    }
    this.stopAmbience(fadeOut);
    this.ambience = this.play({ url, group: 'ambience', volume, loop: true, fadeIn });
  }

  stopAmbience(fade = 2) {
    if (this.ambience) this._fadeStop(this.ambience, fade);
    this.ambience = null;
  }

  // ---------- global controls ----------
  setMuted(muted) {
    this.muted = Boolean(muted);
    if (!this.master) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.03);
  }

  async suspend() {
    if (this.ctx?.state === 'running') await withTimeout(this.ctx.suspend(), 800);
  }

  async resume() {
    if (this.ctx && this.ctx.state !== 'running') await withTimeout(this.ctx.resume(), 800);
  }

  dispose() {
    this.stopAll(0);
    this.listeners.clear();
    this.entries.clear();
    if (this.ctx) {
      this.ctx.removeEventListener('statechange', this._onState);
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
