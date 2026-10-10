// Builds the ONE master GSAP timeline from the normalized scenes.
// Everything (pictures, text, screen effects, sounds, vibration) is a cue placed on this timeline,
// so pausing, resuming and replaying the timeline keeps everything in sync.
import gsap from 'gsap';
import { getEffect } from './effects/index.js';
import { customEffects } from '../data/customEffects.js';

const LATER = { immediateRender: false };

// Add an effect to the timeline. A broken effect is logged and skipped; it never crashes the sequence.
function place(tl, found, target, intensity, opts, at) {
  if (!found) return;
  try {
    const anim = found.fn(target, intensity, opts);
    if (anim) tl.add(anim, Math.max(0, at));
  } catch (err) {
    console.warn('[flashback] An effect failed and was skipped:', err);
  }
}

const durationOf = (entry, fn, fallback) => entry?.duration ?? (fn.duration ?? fallback);

function addSceneStart(tl, scene, refs) {
  const { start, visualStart: v0 } = scene;
  // Clean slate between scenes.
  tl.set(refs.slot, { opacity: 0, x: 0, y: 0, xPercent: 0, scale: 1, rotation: 0, skewX: 0, skewY: 0, filter: 'none' }, start);
  tl.set(refs.camera, { x: 0, y: 0, rotation: 0, skewX: 0, scale: 1, opacity: 1, filter: 'none' }, start);
  tl.set([refs.overlay, refs.dark, refs.burn, refs.blackout, refs.flash], { opacity: 0 }, start);
  tl.set(refs.bg, { backgroundColor: '#050506' }, start);
  tl.set(refs.bg, { backgroundColor: scene.background }, v0);
}

function addLook(tl, scene, refs, reduced) {
  const v0 = scene.visualStart;
  if (scene.overlay) tl.set(refs.overlay, { backgroundColor: scene.overlay.color, opacity: scene.overlay.opacity }, v0);

  const d = scene.darkness;
  if (d) {
    if (d.isStatic) tl.set(refs.dark, { opacity: d.to }, v0);
    else tl.fromTo(refs.dark, { opacity: d.from }, { opacity: d.to, duration: d.duration ?? scene.duration, ease: 'none', ...LATER }, v0 + d.at);
  }

  const b = scene.blur;
  if (b) {
    if (b.isStatic) tl.set(refs.slot, { filter: `blur(${b.to}px)` }, v0);
    else tl.fromTo(refs.slot, { filter: `blur(${b.from}px)` }, { filter: `blur(${b.to}px)`, duration: b.duration ?? scene.duration, ease: 'power2.out', ...LATER }, v0 + b.at);
  }

  if (!reduced) {
    const z = scene.zoom;
    if (z) tl.fromTo(refs.slot, { scale: z.from }, { scale: z.to, duration: z.duration ?? scene.duration, ease: 'none', ...LATER }, v0 + z.at);
    const r = scene.rotation;
    if (r) tl.fromTo(refs.slot, { rotation: r.from }, { rotation: r.to, duration: r.duration ?? scene.duration, ease: 'none', ...LATER }, v0 + r.at);
  }
}

function addImage(tl, scene, refs, reduced) {
  if (!scene.image) return;
  const v0 = scene.visualStart;
  const k = scene.intensity;

  // entrance
  const ent = getEffect(['image', 'screen'], scene.entrance?.effect, { reduced, fallback: 'fade' });
  if (ent) {
    const target = ent.group === 'image' ? refs.slot : refs;
    place(tl, ent, target, k * (scene.entrance.intensity ?? 1), { duration: durationOf(scene.entrance, ent.fn, 1.5), refs }, v0);
  } else tl.set(refs.slot, { opacity: 1 }, v0);

  // continuous / timed image effects
  scene.imageEffects.forEach((entry) => {
    const found = getEffect(['image', 'screen'], entry.effect, { reduced });
    if (!found) return;
    const at = entry.at ?? 0;
    const target = found.group === 'image' ? refs.slot : refs;
    place(tl, found, target, k * (entry.intensity ?? 1), { duration: durationOf(entry, found.fn, scene.duration - at), refs }, v0 + at);
  });
}

function addExit(tl, scene, refs, reduced) {
  const ex = scene.exit;
  const found = ex && getEffect(['image', 'screen'], ex.effect, { reduced, fallback: 'darkFade' });
  if (found) {
    const dur = Math.min(durationOf(ex, found.fn, 1), scene.duration);
    const target = found.group === 'image' ? refs.slot : refs;
    place(tl, found, target, scene.intensity * (ex.intensity ?? 1), { duration: dur, refs }, scene.end - dur);
  }
}

function addText(tl, scene, refs, reduced) {
  const v0 = scene.visualStart;
  const k = scene.intensity;
  scene.texts.forEach((cue) => {
    const el = refs.cues.get(cue.id);
    if (!el) return;
    const inFx = getEffect('text', cue.effect, { reduced, fallback: 'fade' });
    const outFx = getEffect('textExit', cue.exit, { reduced, fallback: 'fade' });
    const inDur = cue.inDuration ?? inFx?.fn.duration ?? 1.4;
    const outDur = cue.outDuration ?? outFx?.fn.duration ?? 0.9;
    const tIn = v0 + cue.at;
    const tOut = Math.max(tIn + inDur * 0.5, v0 + cue.at + cue.duration - outDur);

    tl.set(el, { opacity: 1 }, tIn);
    tl.call(() => { if (refs.live) refs.live.textContent = cue.text; }, null, tIn);
    place(tl, inFx, el, k, { duration: inDur, refs }, tIn);
    place(tl, outFx, el, k, { duration: outDur, refs }, tOut);
    tl.set(el, { opacity: 0 }, tOut + outDur);
  });
  // safety: nothing stays on screen after the scene
  tl.set([...refs.cues.values()].filter((el) => scene.texts.some((c) => refs.cues.get(c.id) === el)), { opacity: 0 }, scene.end);
}

function addTimedEffects(tl, scene, refs, reduced) {
  const v0 = scene.visualStart;
  scene.timed.forEach((entry) => {
    const found = getEffect(['screen', 'image'], entry.effect, { reduced });
    if (!found) return;
    const target = found.group === 'image' ? refs.slot : refs;
    place(tl, found, target, scene.intensity * (entry.intensity ?? 1), { duration: durationOf(entry, found.fn, 0.6), refs }, v0 + entry.at);
  });
}

function addAudioAndHaptics(tl, scene, { audio, haptics }, reduced) {
  const v0 = scene.visualStart;
  const vol = scene.volume;

  if (scene.ambience) {
    const a = scene.ambience;
    tl.call(() => audio.setAmbience({ url: a.src, volume: a.volume * vol, fadeIn: a.fadeIn, fadeOut: a.fadeOut }), null, v0 + (a.at || 0));
  } else if (scene.ambience === null) {
    tl.call(() => audio.stopAmbience(2.5), null, v0);
  }

  if (scene.voice) {
    const v = scene.voice;
    tl.call(() => audio.play({ url: v.src, group: 'voice', volume: v.volume * vol, sceneIndex: scene.index }), null, v0 + v.at);
  }
  scene.soundEffects.forEach((s) => {
    tl.call(() => audio.play({ url: s.src, group: 'sfx', volume: s.volume * vol, sceneIndex: scene.index }), null, v0 + s.at);
  });

  if (!reduced) {
    scene.vibration.forEach((v) => tl.call(() => haptics.vibrate(v.pattern), null, v0 + v.at));
  }
  // fade out this scene's voice and effects when it ends (ambience carries over on purpose)
  tl.call(() => audio.stopScene(scene.index, 0.3), null, scene.end);
}

function addCustom(tl, scene, env, reduced) {
  scene.custom.forEach(({ name, at }) => {
    const fn = customEffects[name];
    if (typeof fn !== 'function') { console.warn(`[flashback] Unknown custom effect "${name}" - skipped.`); return; }
    const api = {
      gsap, scene, refs: env.refs, audio: env.audio, haptics: env.haptics, reducedMotion: reduced,
      at: scene.visualStart + at, end: scene.end,
      effect: (effectName, group = 'screen') => getEffect(group, effectName),
    };
    try { fn.call(api, tl, api); } catch (err) { console.warn(`[flashback] Custom effect "${name}" failed:`, err); }
  });
}

export function buildTimeline({ scenes, refs, audio, haptics, hooks, reduced, endHold = 3 }) {
  const tl = gsap.timeline({ paused: true });
  const env = { refs, audio, haptics };

  scenes.forEach((scene) => {
    tl.call(hooks.onSceneEnter, [scene], scene.start);   // preload next, wait if media is late, place the picture
    addSceneStart(tl, scene, refs);
    addLook(tl, scene, refs, reduced);
    addImage(tl, scene, refs, reduced);
    addText(tl, scene, refs, reduced);
    addTimedEffects(tl, scene, refs, reduced);
    addAudioAndHaptics(tl, scene, env, reduced);
    addCustom(tl, scene, env, reduced);
    addExit(tl, scene, refs, reduced);
    tl.set(refs.slot, { opacity: 0 }, scene.end);
    tl.call(hooks.onSceneExit, [scene], scene.end);
  });

  const last = scenes[scenes.length - 1];
  tl.call(hooks.onEnd, null, (last?.end ?? 0) + endHold);
  return tl;
}
