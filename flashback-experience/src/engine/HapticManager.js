// Vibration for the sequence. The timeline calls vibrate() at the configured moments.
// Safe everywhere: unsupported browsers (all of iOS Safari, desktops) just return false.
import { hapticsSupported, vibrate } from '../utils/haptics.js';

const MAX_TOTAL_MS = 1500;   // no single cue can buzz longer than this
const MAX_STEPS = 16;

// Accepts 80, [60, 40, 120] ... and returns a clean number / array or null.
function sanitize(pattern) {
  if (typeof pattern === 'number') return Number.isFinite(pattern) && pattern > 0 ? Math.min(pattern, MAX_TOTAL_MS) : null;
  if (!Array.isArray(pattern)) return null;
  const out = [];
  let total = 0;
  for (const raw of pattern.slice(0, MAX_STEPS)) {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0) continue;
    const step = Math.min(v, MAX_TOTAL_MS - total);
    if (step <= 0) break;
    out.push(step);
    total += step;
  }
  return out.length && out.some((_, i) => i % 2 === 0 && out[i] > 0) ? out : null;
}

export class HapticManager {
  constructor({ enabled = true, minGapMs = 150 } = {}) {
    this.enabled = enabled;
    this.minGapMs = minGapMs;
    this.last = -Infinity;
  }

  get supported() { return hapticsSupported(); }

  setEnabled(on) {
    this.enabled = Boolean(on);
    if (!this.enabled) this.cancel();
  }

  // Returns true if a vibration was actually requested.
  vibrate(pattern) {
    if (!this.enabled || !this.supported) return false;
    const clean = sanitize(pattern);
    if (!clean) return false;
    const now = performance.now();
    if (now - this.last < this.minGapMs) return false; // never spam
    this.last = now;
    vibrate(clean);
    return true;
  }

  cancel() { if (this.supported) vibrate(0); }

  dispose() { this.cancel(); }
}
