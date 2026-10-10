// Builds the master timeline once the stage exists and returns a stable controller.
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { createPlayback } from '../engine/Playback.js';

export function useMasterTimeline(rootRef, engine, onStatus) {
  const controller = useRef(null);
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useLayoutEffect(() => {
    if (!engine || !rootRef.current) return undefined;
    const ctx = gsap.context(() => {
      controller.current = createPlayback({
        root: rootRef.current,
        scenes: engine.scenes,
        settings: engine.settings,
        audio: engine.audio,
        haptics: engine.haptics,
        loader: engine.loader,
        onStatus: (s) => statusRef.current?.(s),
      });
    }, rootRef);
    // Dev-only inspection handle (removed from production builds by Vite).
    if (import.meta.env.DEV) window.__fb = { controller: controller.current, engine };
    return () => {
      if (import.meta.env.DEV) delete window.__fb;
      controller.current?.dispose();
      controller.current = null;
      ctx.revert();
    };
  }, [engine, rootRef]);

  return controller;
}
