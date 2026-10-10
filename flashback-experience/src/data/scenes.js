// =====================================================================================
//  YOUR SCENES. This is the only file you need to edit to change the experience.
// =====================================================================================
//  * Times are in SECONDS. A cue's "at" is measured from the moment the scene's picture starts
//    (after the scene's own "delay").
//  * The sequence plays the scenes one after another, top to bottom.
//  * This file is plain data (no imports, no browser code). The server sends it to the browser only
//    after the password is accepted, so keep it JSON-friendly: strings, numbers, true/false, lists.
//  * Only "id" is required. Everything else has a sensible default.
//  * Files are looked up under /media/... (the public/media folder) unless you set mediaBase below.
//
//  Effects are referenced by NAME. The full list of names is in README.md ("Effects reference").
// =====================================================================================

export const settings = {
  // Where media files live. '' = this site's public/media folder (served only after login in production).
  // For Cloudinary PUBLIC delivery URLs use e.g. 'https://res.cloudinary.com/<your-cloud>/'.
  // You can also set the MEDIA_BASE environment variable instead (no code change, no rebuild).
  // NEVER put an API secret here: this file is not secret-safe for keys.
  mediaBase: globalThis.process?.env?.MEDIA_BASE ?? '',

  endHold: 3.5,          // seconds of black after the last scene before the REPLAY button appears
  loadTimeout: 12,       // seconds to wait for media before carrying on without it
};

export const scenes = [
  // ---------------------------------------------------------------- scene 1 (landscape photo)
  {
    id: 'scene-01',
    duration: 11,                     // how long the scene lasts
    delay: 0.4,                       // black pause before the picture starts
    background: '#050506',

    image: '/media/images/scene-01.webp',
    imagePosition: 'center',          // CSS object-position, e.g. 'center 30%' to favour the top
    imageFit: 'cover',                // 'cover' fills the screen, 'contain' shows the whole picture
    entranceEffect: { effect: 'fade', duration: 2.6 },
    imageEffect: 'slowZoom',          // continuous camera move; use a list for several
    exitEffect: { effect: 'blackout', duration: 0.5 },

    overlay: { color: '#0b1a22', opacity: 0.3 },   // colour wash over the picture
    darkness: 0.2,                    // 0 = none, 1 = black

    ambience: { src: '/media/audio/ambience-01.mp3', volume: 0.5, fadeIn: 2.5 },
    voice: { src: '/media/audio/voice-01.mp3', at: 1.6, volume: 1 },
    soundEffects: [{ src: '/media/audio/impact-01.mp3', at: 8.6, volume: 1 }],

    text: [
      { text: 'You remember this place.', at: 1.2, duration: 4.4, style: 'whisper', effect: 'blurToSharp', position: 'lower' },
      { text: 'Don’t you?', at: 5.6, duration: 3.4, style: 'caption', effect: 'typeOn', inDuration: 1.3, position: 'lower' },
    ],

    // Things that happen at an exact moment (all optional):
    flash: { at: 8.6, intensity: 0.7 },
    shake: { at: 8.6, duration: 0.8, intensity: 1 },
    vibration: { at: 8.6, pattern: [70, 40, 150] },   // Android only; ignored elsewhere
    intensity: 1,                     // multiplies every effect in this scene (0.5 = gentler)
    volume: 1,                        // multiplies every sound in this scene
  },

  // ---------------------------------------------------------------- scene 2 (portrait photo)
  {
    id: 'scene-02',
    duration: 11,
    image: '/media/images/scene-02.webp',
    imagePosition: 'center 40%',
    entranceEffect: { effect: 'suddenReveal', duration: 0.9 },
    imageEffect: 'drift',
    blur: { from: 10, to: 0, duration: 2.4 },          // starts out of focus, comes into focus
    exitEffect: { effect: 'burn', duration: 2.6 },     // 'crack' is the other destroy effect
    darkness: 0.15,

    voice: { src: '/media/audio/voice-02.mp3', at: 0.8 },
    text: [
      { text: 'It was never quiet.', at: 1.0, duration: 4.0, style: 'caption', effect: 'cinematicReveal', inDuration: 2.4 },
      { text: 'REMEMBER', at: 6.0, duration: 3.2, style: 'impact', effect: 'scaleBurst', exit: 'dissolve', position: 'center' },
    ],

    glitch: [{ at: 5.9, duration: 0.5, intensity: 1 }],
    effects: [{ effect: 'chromatic', at: 6.0, duration: 0.7, intensity: 1 }],
    soundEffects: [{ src: '/media/audio/impact-01.mp3', at: 6.0, volume: 0.9 }],
    vibration: [{ at: 6.0, pattern: [50, 30, 50] }],
    custom: [{ name: 'heartbeat', at: 3.2 }],          // defined in src/data/customEffects.js
  },

  // ---------------------------------------------------------------- scene 3 (text only)
  {
    id: 'scene-03',
    duration: 9,
    delay: 0.6,
    image: null,                                       // no picture: just words in the dark
    ambience: null,                                    // fade the ambience out (leave this line out to keep it playing)
    text: [
      { text: 'Now you know.', at: 1.2, duration: 6.4, style: 'title', effect: 'letterSpacing', inDuration: 3, exit: 'blurOut' },
    ],
    exitEffect: 'cut',
  },
];
