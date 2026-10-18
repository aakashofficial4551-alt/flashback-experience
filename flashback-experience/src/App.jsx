import React, { useState, useEffect, useRef } from 'react';

// --- CINEMATIC STYLES ---
// Injected directly to ensure a self-contained, high-performance experience
const cinematicStyles = `
  :root {
    --obsidian: #0a0a0c;
    --midnight: #12151f;
    --crimson: #8a0303;
    --emergency-red: #ff1e1e;
    --emergency-blue: #1e3cff;
    --text-primary: #e0e0e0;
    --text-muted: #888899;
  }

  body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background-color: var(--obsidian);
    color: var(--text-primary);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    overflow: hidden;
    user-select: none;
  }

  /* Film Grain Overlay */
  .film-grain {
    position: fixed;
    top: -50%; left: -50%; right: -50%; bottom: -50%;
    width: 200%; height: 200%;
    background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.05"/%3E%3C/svg%3E');
    pointer-events: none;
    z-index: 9999;
    animation: grainAnimation 8s steps(10) infinite;
  }
  @keyframes grainAnimation {
    0% { transform: translate(0, 0); }
    10% { transform: translate(-5%, -5%); }
    20% { transform: translate(-10%, 5%); }
    30% { transform: translate(5%, -10%); }
    40% { transform: translate(-5%, 15%); }
    50% { transform: translate(-10%, 5%); }
    60% { transform: translate(15%, 0); }
    70% { transform: translate(0, 15%); }
    80% { transform: translate(3%, 35%); }
    90% { transform: translate(-10%, 10%); }
    100% { transform: translate(0, 0); }
  }

  /* Realistic Emergency Lighting */
  .emergency-light-layer {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    mix-blend-mode: overlay;
    z-index: 10;
    opacity: 0;
    transition: opacity 2s ease-in-out;
  }
  .emergency-light-layer.active {
    opacity: 0.4;
    animation: emergencyPulse 3s infinite;
  }
  @keyframes emergencyPulse {
    0%, 100% { background: radial-gradient(circle at 20% 50%, rgba(255,30,30,0.4) 0%, transparent 60%); }
    50% { background: radial-gradient(circle at 80% 50%, rgba(30,60,255,0.4) 0%, transparent 60%); }
  }

  /* Cinematic Image Movement */
  .scene-image {
    width: 100%; height: 100%;
    object-fit: cover;
    transform: scale(1.05);
    transition: transform 20s linear, filter 2s ease;
    filter: brightness(0.6) contrast(1.1);
  }
  .scene-image.drifting {
    transform: scale(1.15) translate(-2%, 1%);
  }

  /* Typography & UI */
  .premium-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    color: white;
    font-size: 1.2rem;
    text-align: center;
    padding: 10px;
    outline: none;
    transition: border-color 0.3s ease;
    letter-spacing: 0.2rem;
  }
  .premium-input:focus { border-bottom: 1px solid rgba(255,255,255,0.8); }

  .fade-in { animation: fadeIn 2s ease forwards; }
  .fade-out { animation: fadeOut 2s ease forwards; }
  
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

  .control-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 0.8rem;
    letter-spacing: 0.1rem;
    text-transform: uppercase;
    transition: all 0.4s ease;
    backdrop-filter: blur(5px);
  }
  .control-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.6);
  }
`;

// --- DATA SCENES (Integrating provided assets) ---
const SCENES = [
  {
    id: 1,
    image: '/media/images/scene-01.webp',
    audio: '/media/audio/voice-01.mp3',
    text: "The night everything changed. The shadows felt different."
  },
  {
    id: 2,
    image: '/media/images/scene-02.webp',
    audio: '/media/audio/voice-02.mp3',
    text: "We were looking for answers, but found only echoes."
  }
];

export default function App() {
  // Application States
  const [authStatus, setAuthStatus] = useState('locked'); // locked, loading, ready, started
  const [password, setPassword] = useState('');
  
  // Scene States
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [emergencyLights, setEmergencyLights] = useState(true);
  const [imageDrift, setImageDrift] = useState(false);

  // Audio Refs
  const ambienceAudio = useRef(null);
  const voiceAudio = useRef(null);
  const impactAudio = useRef(null);

  // --- AUDIO INITIALIZATION ---
  useEffect(() => {
    ambienceAudio.current = new Audio('/media/audio/ambience-01.mp3');
    ambienceAudio.current.loop = true;
    ambienceAudio.current.volume = 0.3;

    impactAudio.current = new Audio('/media/audio/impact-01.mp3');
    impactAudio.current.volume = 0.6;

    return () => {
      if(ambienceAudio.current) ambienceAudio.current.pause();
      if(voiceAudio.current) voiceAudio.current.pause();
    };
  }, []);

  // --- PASSWORD GATE LOGIC ---
  const handleAuth = (e) => {
    e.preventDefault();
    if (password === 'memory') { // Replace with your actual secure logic
      setAuthStatus('loading');
      if (impactAudio.current) impactAudio.current.play();
      
      // Simulate Cinematic Loading
      setTimeout(() => {
        setAuthStatus('ready');
      }, 4000);
    } else {
      setPassword('');
      // Vibrate on wrong password if supported
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    }
  };

  // --- EXPERIENCE START ---
  const startExperience = () => {
    setAuthStatus('started');
    if (!isMuted) ambienceAudio.current.play();
    playSceneAudio(0);
    setTimeout(() => setImageDrift(true), 100); // Trigger drift animation
  };

  // --- AUDIO SYNCHRONIZATION & PLAYBACK ---
  const playSceneAudio = (index) => {
    if (voiceAudio.current) voiceAudio.current.pause();
    
    voiceAudio.current = new Audio(SCENES[index].audio);
    voiceAudio.current.volume = 0.8;
    
    if (isPlaying && !isMuted) {
      voiceAudio.current.play().catch(e => console.log("Audio autoplay prevented"));
    }

    voiceAudio.current.onended = () => {
      if (index < SCENES.length - 1) {
        // Subtle transition to next scene
        setImageDrift(false);
        setTimeout(() => {
          setCurrentSceneIdx(index + 1);
          playSceneAudio(index + 1);
          setTimeout(() => setImageDrift(true), 100);
        }, 2000);
      }
    };
  };

  // Toggle Pause/Resume
  const togglePlay = () => {
    if (isPlaying) {
      if(voiceAudio.current) voiceAudio.current.pause();
      if(ambienceAudio.current) ambienceAudio.current.pause();
      setImageDrift(false);
    } else {
      if(!isMuted) {
        if(voiceAudio.current) voiceAudio.current.play();
        ambienceAudio.current.play();
      }
      setImageDrift(true);
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle Mute
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if(ambienceAudio.current) ambienceAudio.current.muted = newMuteState;
    if(voiceAudio.current) voiceAudio.current.muted = newMuteState;
  };

  return (
    <>
      <style>{cinematicStyles}</style>
      <div className="film-grain" />

      {/* 1. PREMIUM ACCESS GATE */}
      {authStatus === 'locked' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--midnight)' }}>
          <h2 style={{ letterSpacing: '0.3rem', fontWeight: 300, marginBottom: '40px', opacity: 0.7 }}>PRIVATE ARCHIVE</h2>
          <form onSubmit={handleAuth}>
            <input 
              type="password" 
              className="premium-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Access Key"
              autoFocus
            />
          </form>
        </div>
      )}

      {/* 2. CINEMATIC LOADING EXPERIENCE */}
      {authStatus === 'loading' && (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--obsidian)' }}>
          <p style={{ letterSpacing: '0.2rem', fontStyle: 'italic', opacity: 0.5, animation: 'pulse 2s infinite' }}>Restoring the moment...</p>
        </div>
      )}

      {/* 3. OPENING SEQUENCE (START GATE) */}
      {authStatus === 'ready' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--obsidian)' }}>
          <h1 style={{ letterSpacing: '0.5rem', fontSize: '2.5rem', fontWeight: 300, textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>FLASHBACK EXPERIENCE</h1>
          <p style={{ letterSpacing: '0.1rem', opacity: 0.6, margin: '20px 0 60px 0', fontStyle: 'italic' }}>"Some moments never really leave us."</p>
          <button className="control-btn" onClick={startExperience}>Enter Experience</button>
        </div>
      )}

      {/* 4. IMMERSIVE FIRST-PERSON ENVIRONMENT */}
      {authStatus === 'started' && (
        <div className="fade-in" style={{ position: 'relative', width: '100%', height: '100vh' }}>
          
          {/* Background Image Layer with Parallax / Drift */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
            <img 
              src={SCENES[currentSceneIdx].image} 
              alt="Memory" 
              className={`scene-image ${imageDrift ? 'drifting' : ''}`} 
              key={currentSceneIdx} // Forces re-render on scene change for animation reset
            />
          </div>

          {/* Realistic Emergency Lighting System */}
          <div className={`emergency-light-layer ${emergencyLights ? 'active' : ''}`} />

          {/* Vignette / Atmospheric Haze */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, transparent 40%, #000000 100%)', pointerEvents: 'none' }} />

          {/* Cinematic Text Reveal */}
          <div style={{ position: 'absolute', bottom: '20%', left: '10%', right: '10%', textAlign: 'center', zIndex: 20 }}>
            <p className="fade-in" key={`text-${currentSceneIdx}`} style={{ fontSize: '1.5rem', letterSpacing: '0.05rem', fontWeight: 300, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {SCENES[currentSceneIdx].text}
            </p>
          </div>

          {/* Experience Controls */}
          <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '20px', zIndex: 30 }}>
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
            <button className="control-btn" onClick={toggleMute}>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button className="control-btn" onClick={() => setEmergencyLights(!emergencyLights)}>
              Lights {emergencyLights ? 'Off' : 'On'}
            </button>
          </div>

        </div>
      )}
    </>
  );
}
