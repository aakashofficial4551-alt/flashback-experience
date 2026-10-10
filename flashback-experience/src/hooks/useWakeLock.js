// Keeps the phone screen awake while the sequence plays (where the browser supports it).
import { useEffect } from 'react';

export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let gone = false;
    const request = async () => {
      try { lock = await navigator.wakeLock.request('screen'); if (gone) lock.release().catch(() => {}); } catch { /* denied: fine */ }
    };
    request();
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { gone = true; document.removeEventListener('visibilitychange', onVisible); lock?.release().catch(() => {}); };
  }, [active]);
}
