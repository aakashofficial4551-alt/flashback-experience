// Minimal audio helper for Phase 3.
// Phase 6 replaces/extends this with the full AudioManager (voices, ambience, layers).
// Browsers only allow sound after a user gesture, so unlockAudio() MUST be called
// synchronously inside a click/tap/submit handler (before any `await`).

let ctx = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx ||= new AC();
    if (ctx.state === 'suspended') ctx.resume();
    // Playing one silent sample finishes the unlock on iOS Safari.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  } catch { /* audio unavailable: the experience continues silently */ }
}

export const getAudioContext = () => ctx;

// Synthesized sounds, so Phase 3 needs no audio files.
function tone({ from, to, duration, volume, type = 'sine' }) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export function playDenied() {
  tone({ from: 70, to: 45, duration: 0.22, volume: 0.35, type: 'triangle' });
}

export function playImpact() {
  tone({ from: 110, to: 32, duration: 0.9, volume: 0.9 });
  if (!ctx || ctx.state !== 'running') return;
  // short noise burst on top of the thud
  const len = Math.floor(ctx.sampleRate * 0.25);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const noise = ctx.createBufferSource();
  const lowpass = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  noise.buffer = buf;
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 900;
  gain.gain.value = 0.5;
  noise.connect(lowpass).connect(gain).connect(ctx.destination);
  noise.start();
}
