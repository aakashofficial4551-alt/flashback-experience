// Runs the master timeline and keeps visuals, audio and haptics in step.
// All pause reasons ('user', 'buffering') go into one set; the timeline plays only while the set is empty.
// Pausing the timeline also suspends the AudioContext, so every sound layer freezes at the same moment.
import { buildTimeline } from './buildTimeline.js';
import { collectRefs, clearTransient, resetStage } from './stage.js';
import { prefersReducedMotion } from '../utils/motion.js';

export function createPlayback({ root, scenes, settings, audio, haptics, loader, onStatus }) {
  const refs = collectRefs(root);
  const reduced = prefersReducedMotion();
  const reasons = new Set();
  let status = 'idle';
  let disposed = false;
  let tl = null;

  const emit = () => {
    const next = status === 'ended' ? 'ended'
      : status === 'idle' ? 'idle'
      : reasons.has('buffering') ? 'buffering'
      : reasons.size ? 'paused' : 'playing';
    if (next !== playback.status) { playback.status = next; onStatus?.(next); }
  };

  // Make the timeline + audio match the current set of pause reasons.
  async function sync() {
    if (disposed || !tl) return;
    if (reasons.size) {
      tl.pause();
      haptics.cancel();
      emit();
      await audio.suspend();
    } else {
      emit();
      await audio.resume();
      if (!disposed && !reasons.size && status === 'playing') tl.play();
    }
  }

  const hooks = {
    // Runs at the start of every scene.
    async onSceneEnter(scene) {
      loader.focus(scene.index); // keep this + next scene, load next, release older ones
      clearTransient(refs);
      if (loader.isReady(scene.index)) { placeImage(scene); return; }
      // Media is late: hold the whole sequence (and show the loading state) until it arrives.
      reasons.add('buffering');
      sync();
      await loader.whenReady(scene.index, (settings.loadTimeout ?? 12) * 1000);
      reasons.delete('buffering');
      if (disposed) return;
      placeImage(scene);
      sync();
    },
    onSceneExit() {},
    onEnd() {
      status = 'ended';
      audio.stopAll(1.5);
      haptics.cancel();
      emit();
    },
  };

  function placeImage(scene) {
    refs.slot.replaceChildren();
    const img = loader.getImage(scene.index);
    if (!img || !scene.image) return; // no picture, or it failed to load: dark fallback
    img.style.objectFit = scene.image.fit;
    img.style.objectPosition = scene.image.position;
    refs.slot.append(img);
  }

  tl = buildTimeline({ scenes, refs, audio, haptics, hooks, reduced, endHold: settings.endHold });

  // Leaving the tab freezes the timeline's clock but not the audio: pause both.
  const onVisibility = () => {
    if (document.hidden && status === 'playing') playback.pause();
  };
  document.addEventListener('visibilitychange', onVisibility);
  // Phone call, Bluetooth switch, OS interruption: the audio clock stops, so stop the picture too.
  const offState = audio.onStateChange((state) => {
    if (status === 'playing' && !reasons.size && state && state !== 'running') playback.pause();
  });

  const playback = {
    status: 'idle',
    refs,

    async start() {
      reasons.clear();
      status = 'playing';
      emit();
      await audio.resume();
      if (!disposed && status === 'playing' && !reasons.size) tl.play(0);
    },
    pause() { reasons.add('user'); sync(); },
    resume() { reasons.delete('user'); sync(); },
    toggle() { return reasons.has('user') ? playback.resume() : playback.pause(); },

    setMuted(muted) { audio.setMuted(muted); },

    async replay() {
      if (disposed) return;
      tl.pause(0);
      audio.stopAll(0.05);
      haptics.cancel();
      resetStage(refs);
      reasons.clear();
      status = 'playing';
      emit();
      await audio.resume();
      if (!disposed && status === 'playing' && !reasons.size) tl.play(0);
    },

    get time() { return tl.time(); },
    get timeline() { return tl; },

    dispose() {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      offState();
      tl.kill();
      audio.stopAll(0);
      haptics.cancel();
      resetStage(refs);
    },
  };
  return playback;
}
