// Vibration works on Android Chrome/Firefox. iOS Safari has NO Vibration API, and desktop
// ignores it, so every call is a safe no-op when unsupported. (Stateless on purpose.)
export const hapticsSupported = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function vibrate(pattern) {
  try {
    if (hapticsSupported()) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}
