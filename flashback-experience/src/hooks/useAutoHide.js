// Shows an element on any pointer / key activity and hides it again after `delay` ms.
// Works through a data attribute on the element (no React re-render per mouse move).
import { useEffect } from 'react';

export function useAutoHide(ref, { delay = 3000, pinned = false } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let timer = 0;
    const show = () => {
      el.dataset.visible = 'true';
      clearTimeout(timer);
      if (!pinned) timer = setTimeout(() => { if (!el.contains(document.activeElement)) el.dataset.visible = 'false'; }, delay);
    };
    show();
    const events = ['pointermove', 'pointerdown', 'keydown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, show, { passive: true }));
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, show)); };
  }, [ref, delay, pinned]);
}
