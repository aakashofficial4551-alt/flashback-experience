import { useEffect, useRef, useState } from 'react';
import { useEngine } from '../hooks/useEngine.js';
import { useMasterTimeline } from '../hooks/useMasterTimeline.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import SceneRenderer from './SceneRenderer.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import StartGate from './StartGate.jsx';
import Controls from './Controls.jsx';

// Page 2. States:  loading -> ready (START gate) -> started (playing / paused / buffering / ended)
export default function FlashbackExperience({ onSessionExpired }) {
  const { phase, engine, retry } = useEngine({ onSessionExpired });
  const root = useRef(null);
  const [started, setStarted] = useState(false);
  const [gateGone, setGateGone] = useState(false);
  const [status, setStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [vibrationOn, setVibrationOn] = useState(true);

  const controller = useMasterTimeline(root, engine, setStatus);
  useWakeLock(started && status === 'playing');

  const start = () => {
    engine.audio.unlock();          // inside the click: allowed to make sound from now on
    setStarted(true);
    controller.current?.start();
  };

  const toggleMute = () => { const next = !muted; setMuted(next); engine.audio.setMuted(next); };
  const toggleVibration = () => { const next = !vibrationOn; setVibrationOn(next); engine.haptics.setEnabled(next); };

  // Space = pause / resume, M = mute (ignored while a button has focus so Space still "clicks" it).
  useEffect(() => {
    if (!started) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('button')) return;
      if (e.code === 'Space') { e.preventDefault(); controller.current?.toggle(); }
      if (e.key === 'm' || e.key === 'M') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (phase === 'error') {
    return (
      <main className="cinema cinema--center">
        <p className="loading__text">The memory could not be loaded.</p>
        <button type="button" className="start__button" onClick={retry}>TRY AGAIN</button>
      </main>
    );
  }

  return (
    <main className="cinema" data-status={status}>
      {engine && <SceneRenderer ref={root} scenes={engine.scenes} />}
      {phase === 'loading' && <LoadingScreen />}
      {phase === 'ready' && !gateGone && <StartGate onStart={start} onGone={() => setGateGone(true)} />}
      {started && status === 'buffering' && <LoadingScreen overlay />}
      {started && (
        <Controls
          status={status}
          muted={muted}
          vibration={engine.haptics.supported ? { on: vibrationOn, onToggle: toggleVibration } : null}
          onToggle={() => controller.current?.toggle()}
          onMute={toggleMute}
          onReplay={() => controller.current?.replay()}
        />
      )}
    </main>
  );
}

