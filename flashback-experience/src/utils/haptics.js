// Vibration works on Android Chrome/Firefox. iOS Safari has no Vibration API,
// and desktop ignores it, so every call is a safe no-op when unsupported.
export function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch { /* ignore */ }
}
