// Helpers that talk to the stage DOM built by SceneRenderer (elements marked with data-ref / data-cue).
import gsap from 'gsap';

export function collectRefs(root) {
  const refs = { root };
  root.querySelectorAll('[data-ref]').forEach((el) => { refs[el.dataset.ref] = el; });
  refs.cues = new Map();
  root.querySelectorAll('[data-cue]').forEach((el) => refs.cues.set(el.dataset.cue, el));
  return refs;
}

// Removes short-lived elements effects create (chromatic copies, crack shards, crack lines).
export function clearTransient(refs) {
  refs.root.querySelectorAll('.chroma-ch, .shard, .crack-svg').forEach((n) => n.remove());
  refs.slot?.querySelectorAll('img').forEach((i) => { i.style.visibility = ''; });
}

// Back to the untouched look: used before a replay and on unmount.
export function resetStage(refs) {
  clearTransient(refs);
  const named = ['camera', 'slot', 'bg', 'overlay', 'dark', 'burn', 'shards', 'vignette', 'flash', 'blackout'];
  gsap.set(named.map((n) => refs[n]).filter(Boolean), { clearProps: 'all' });
  gsap.set([...refs.cues.values()], { clearProps: 'all' });
  gsap.set([...refs.cues.values()].flatMap((el) => [...el.querySelectorAll('.w, .c')]), { clearProps: 'all' });
  refs.slot?.replaceChildren();
  refs.root.style.removeProperty('--split');
  document.documentElement.style.removeProperty('--grain');
  if (refs.live) refs.live.textContent = '';
}
