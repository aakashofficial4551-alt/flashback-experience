import { useRef } from 'react';
import { useAutoHide } from '../hooks/useAutoHide.js';

// Minimal, auto-hiding controls. They stay visible while paused / ended, appear on any tap, mouse move
// or key press, and stay reachable by keyboard even when faded out (focus brings them back).
export default function Controls({ status, muted, vibration, onToggle, onMute, onReplay }) {
  const root = useRef(null);
  const pinned = status === 'paused' || status === 'ended';
  useAutoHide(root, { delay: 3200, pinned });

  const ended = status === 'ended';
  return (
    <div className={`controls${ended ? ' controls--ended' : ''}`} ref={root} data-visible="true" data-pinned={pinned}>
      {!ended && (
        <button type="button" onClick={onToggle} aria-label={status === 'paused' ? 'Resume' : 'Pause'}>
          {status === 'paused' ? 'RESUME' : 'PAUSE'}
        </button>
      )}
      {!ended && (
        <button type="button" onClick={onMute} aria-pressed={muted} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>
          {muted ? 'SOUND OFF' : 'SOUND ON'}
        </button>
      )}
      {!ended && vibration && (
        <button type="button" onClick={vibration.onToggle} aria-pressed={vibration.on} aria-label="Toggle vibration">
          {vibration.on ? 'VIBRATION ON' : 'VIBRATION OFF'}
        </button>
      )}
      <button type="button" onClick={onReplay} aria-label="Replay from the start">REPLAY</button>
    </div>
  );
}
