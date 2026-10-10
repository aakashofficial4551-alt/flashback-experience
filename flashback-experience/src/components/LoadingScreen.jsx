import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/motion.js';

// Black screen, a slow-breathing line of text, film grain (global). No spinner.
// `overlay` = shown on top of a paused sequence while late media arrives.
export default function LoadingScreen({ overlay = false }) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(root.current, { opacity: 0, duration: overlay ? 0.6 : 1.2, ease: 'power1.out' });
      if (!prefersReducedMotion()) {
        gsap.to('.loading__text', { opacity: 0.35, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      }
    }, root);
    return () => ctx.revert();
  }, [overlay]);

  return (
    <div className={`loading${overlay ? ' loading--overlay' : ''}`} ref={root} role="status">
      <p className="loading__text">LOADING MEMORY...</p>
    </div>
  );
}
