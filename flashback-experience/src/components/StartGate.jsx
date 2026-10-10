import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/motion.js';

// The "START EXPERIENCE" click. Browsers only allow sound after a real click, so the parent's
// onStart runs audio.unlock() synchronously here (also needed after a reload with a valid login).
export default function StartGate({ onStart, onGone }) {
  const root = useRef(null);
  const button = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const d = prefersReducedMotion() ? 0.01 : 1;
      gsap.from(root.current, { opacity: 0, duration: 1.4 * d, ease: 'power2.out' });
      gsap.from('.start__line', { scaleX: 0, duration: 1.4 * d, delay: 0.5 * d, ease: 'power3.inOut' });
    }, root);
    button.current?.focus({ preventScroll: true });
    return () => ctx.revert();
  }, []);

  const click = () => {
    onStart(); // synchronous: unlocks audio inside the user gesture
    gsap.to(root.current, { opacity: 0, duration: prefersReducedMotion() ? 0.01 : 0.9, ease: 'power1.in', onComplete: onGone });
  };

  return (
    <div className="start" ref={root}>
      <button type="button" className="start__button" ref={button} onClick={click}>START EXPERIENCE</button>
      <span className="start__line" />
      <p className="start__hint">Headphones recommended. Contains sudden sound and flashing light.</p>
    </div>
  );
}
