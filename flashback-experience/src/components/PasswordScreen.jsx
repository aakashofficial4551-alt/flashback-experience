import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { unlockAudio, playDenied, playImpact } from '../utils/audio.js';
import { vibrate } from '../utils/haptics.js';
import { prefersReducedMotion } from '../utils/motion.js';

const MESSAGES = {
  wrong: 'Incorrect password. Try again.',
  limit: 'Too many attempts. Wait a minute, then try again.',
  network: 'Cannot reach the server. Check your connection and try again.',
};

export default function PasswordScreen({ onSuccess }) {
  const root = useRef(null);
  const form = useRef(null);
  const input = useRef(null);
  const flash = useRef(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Intro: one slow reveal out of black.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const d = prefersReducedMotion() ? 0.01 : 1;
      gsap.from(root.current, { opacity: 0, duration: 2.2 * d, ease: 'power2.out' });
      gsap.from('.gate__line', { scaleX: 0, duration: 1.6 * d, delay: 0.9 * d, ease: 'power3.inOut' });
    }, root);
    return () => ctx.revert(); // kills tweens on unmount
  }, []);

  useEffect(() => () => gsap.killTweensOf([form.current, flash.current]), []);

  const wrong = (msg) => {
    setError(msg);
    setBusy(false);
    playDenied();
    vibrate([60, 40, 60]);
    if (prefersReducedMotion()) return;
    gsap.set(form.current, { x: 0 });
    gsap.to(form.current, { keyframes: { x: [-14, 12, -9, 6, -3, 0], easeEach: 'power2.out' }, duration: 0.45 });
    // brief dark-red underline that eases back to its normal colour
    gsap.from('.gate__line', { backgroundColor: '#7a2a2a', duration: 1.1, clearProps: 'backgroundColor' });
  };

  // Freeze -> impact -> blackout -> flash -> hand over to Page 2.
  const playSuccess = () => {
    playImpact();
    vibrate([40, 30, 160]);
    const quick = prefersReducedMotion();
    const tl = gsap.timeline({ onComplete: onSuccess });
    tl.to(form.current, { scale: quick ? 1 : 1.04, duration: 0.5, ease: 'power1.in' })           // freeze / push in
      .to(root.current.querySelector('.gate__content'), { opacity: 0, duration: 0.08 }, '>')      // blackout on impact
      .fromTo(flash.current, { opacity: 0 }, { opacity: quick ? 0.4 : 0.95, duration: 0.05 }, '<')
      .to(flash.current, { opacity: 0, duration: quick ? 0.2 : 0.7, ease: 'power2.out' })
      .to({}, { duration: quick ? 0.1 : 0.6 });                                                   // silence in the dark
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !password) return;
    unlockAudio(); // must run synchronously in the user gesture, before any await
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { setPassword(''); playSuccess(); }
      else wrong(res.status === 429 ? MESSAGES.limit : MESSAGES.wrong);
    } catch {
      wrong(MESSAGES.network);
    }
  };

  return (
    <main className="gate" ref={root}>
      <div className="gate__content">
        <form className="gate__form" ref={form} onSubmit={submit} noValidate>
          <label className="visually-hidden" htmlFor="pw">Password</label>
          <input
            id="pw" ref={input} type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password" autoComplete="current-password"
            autoCapitalize="off" autoCorrect="off" spellCheck="false"
            disabled={busy} aria-invalid={Boolean(error)} aria-describedby="pw-msg"
          />
          <span className="gate__line" />
          <button type="submit" disabled={busy || !password}>Enter</button>
          <p id="pw-msg" className="gate__msg" role="alert">{error}</p>
        </form>
      </div>
      <div className="flash" ref={flash} aria-hidden="true" />
    </main>
  );
}
