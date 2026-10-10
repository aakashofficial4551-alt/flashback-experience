// The effect registry. Scenes refer to effects by NAME (strings in src/data/scenes.js).
import * as imageModule from './imageEffects.js';
import { textEffects, textExits } from './textEffects.js';
import { screenEffects } from './screenEffects.js';

const image = { ...imageModule };

const groups = { image, screen: screenEffects, text: textEffects, textExit: textExits };

// Effects that are still OK when the visitor prefers reduced motion (no shaking, flashing or fast movement).
const CALM = {
  image: new Set(['fade', 'fadeOut', 'darkFade', 'cut', 'blurIn', 'blurOut']),
  screen: new Set(['blackout', 'unblack']),
  text: new Set(['fade', 'suddenAppear', 'blurToSharp', 'typeOn']),
  textExit: new Set(['fade', 'blurOut', 'cut', 'dissolve']),
};

export const effectNames = () => Object.fromEntries(Object.entries(groups).map(([g, m]) => [g, Object.keys(m)]));

// Finds an effect by name, searching the given groups in order.
// Returns { fn, group } or null (unknown names are skipped with a console warning, never a crash).
// With reduced motion, a non-calm effect is swapped for `fallback` (or skipped when there is none).
export function getEffect(order, name, { reduced = false, fallback } = {}) {
  for (const group of [].concat(order)) {
    const fn = groups[group]?.[name];
    if (typeof fn !== 'function') continue;
    if (reduced && !CALM[group]?.has(name)) {
      const alt = fallback && groups[[].concat(order)[0]]?.[fallback];
      return alt ? { fn: alt, group: [].concat(order)[0] } : null;
    }
    return { fn, group };
  }
  console.warn(`[flashback] Unknown effect "${name}" - skipped.`);
  return null;
}
