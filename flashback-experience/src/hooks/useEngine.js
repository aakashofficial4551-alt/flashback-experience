// Fetches the (password-protected) scene config, creates the audio / haptics / media managers,
// and preloads the first two scenes. Everything is disposed when the component unmounts.
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { normalizeScenes } from '../engine/sceneConfig.js';
import { AudioManager } from '../engine/AudioManager.js';
import { HapticManager } from '../engine/HapticManager.js';
import { MediaLoader } from '../engine/MediaLoader.js';

const MIN_LOADING_SECONDS = 1.6; // so "LOADING MEMORY..." never just flashes by

const wait = (seconds) => new Promise((resolve) => gsap.delayedCall(seconds, resolve));

export function useEngine({ onSessionExpired }) {
  const [state, setState] = useState({ phase: 'loading', engine: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let engine = null;
    const abort = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/scenes', { signal: abort.signal, cache: 'no-store' });
        if (res.status === 401) { onSessionExpired?.(); return; }
        if (!res.ok) throw new Error(`scenes: HTTP ${res.status}`);
        const { settings, scenes: raw } = await res.json();
        const scenes = normalizeScenes(raw, settings);
        if (!scenes.length) throw new Error('scenes.js has no scenes');

        const audio = new AudioManager();
        const haptics = new HapticManager();
        const loader = new MediaLoader({ scenes, audio, timeoutMs: (settings.loadTimeout ?? 12) * 1000 });
        engine = { scenes, settings, audio, haptics, loader };
        audio.init();
        await Promise.all([loader.preloadInitial(), wait(MIN_LOADING_SECONDS)]);
        if (cancelled) return;
        setState({ phase: 'ready', engine });
      } catch (err) {
        if (cancelled || err?.name === 'AbortError') return;
        console.error('[flashback] Could not start:', err);
        setState({ phase: 'error', engine: null });
      }
    })();

    return () => {
      cancelled = true;
      abort.abort();
      engine?.audio.dispose();
      engine?.haptics.dispose();
      engine?.loader.dispose();
    };
  }, [attempt, onSessionExpired]);

  const retry = () => { setState({ phase: 'loading', engine: null }); setAttempt((n) => n + 1); };
  return { ...state, retry };
}
