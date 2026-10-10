import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

// PLACEHOLDER (Phase 3). Phase 4 replaces this with the scene engine.
// It just proves the hand-off from the password screen works.
export default function FlashbackExperience() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stage__note', { opacity: 0, duration: 2.5, delay: 0.4, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main className="stage" ref={root}>
      <p className="stage__note">Placeholder: the flashback sequence is built in Phase 4.</p>
    </main>
  );
}
