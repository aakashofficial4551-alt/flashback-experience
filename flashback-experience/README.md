# flashback-experience

A private, cinematic two-page experience: a password-protected entrance, then a synchronized flashback sequence (photos, voice, sound, text, effects, vibration) driven by one GSAP master timeline.

## Run locally
Requires Node 20.12 or newer.

```bash
npm install
cp .env.example .env     # then set your own FLASHBACK_PASSWORD and a long random SESSION_SECRET
npm run dev              # open http://localhost:5173
```

`npm run dev` starts the Express API (port 8787) and Vite (port 5173) together. Edit `src/data/scenes.js`, then reload the page (the API restarts itself).

Production build (same as Render):
```bash
npm run build
NODE_ENV=production npm start     # http://localhost:8787
```

## Environment variables
| Name | Purpose |
| --- | --- |
| `FLASHBACK_PASSWORD` | The password visitors must enter. Never committed. |
| `SESSION_SECRET` | Long random string that signs the login cookie. |
| `PORT` | Optional, defaults to 8787. |
| `MEDIA_BASE` | Optional. Public base URL for media (e.g. Cloudinary delivery URL). Empty = local `public/media`. |

## How it works
1. Page 1: password. The server checks it (timing-safe), rate-limits to 5 wrong tries per minute per IP, and sets a signed HttpOnly cookie valid for 6 hours.
2. Page 2: after login the browser fetches the scene config from `/api/scenes` (401 without the cookie), shows `LOADING MEMORY...` while the first two scenes load, then a `START EXPERIENCE` button. The click is what unlocks audio (also needed after a reload with a valid login).
3. One master GSAP timeline is built from the config. Every picture, text, effect, sound and vibration is a cue on it. Pausing the timeline also suspends the AudioContext, so all layers stay in sync through pause / resume / replay.
4. Only the current and next scene are kept loaded. If media is late the sequence holds and shows the loading state; if a file is broken the scene continues without it (dark fallback for pictures, silence for sounds).

## Add or edit a scene
Everything lives in **`src/data/scenes.js`** (plain data, heavily commented). Scenes play top to bottom. Times are in seconds, measured from the moment the scene's picture starts.

```js
{
  id: 'scene-04',
  duration: 9,                       // length of the scene
  delay: 0.5,                        // black pause first (optional)
  image: '/media/images/my-photo.webp',
  imagePosition: 'center 30%',       // which part of the photo stays visible when cropped
  imageFit: 'cover',                 // or 'contain' to show the whole photo
  entranceEffect: { effect: 'fade', duration: 2 },
  imageEffect: 'slowZoom',
  exitEffect: { effect: 'darkFade', duration: 1.5 },
  voice: { src: '/media/audio/my-voice.mp3', at: 1.2, volume: 1 },
  text: [{ text: 'A line of text', at: 2, duration: 4, style: 'caption', effect: 'blurToSharp' }],
  soundEffects: [{ src: '/media/audio/impact-01.mp3', at: 6, volume: 1 }],
  flash: { at: 6, intensity: 0.7 },
  shake: { at: 6, duration: 0.8 },
  vibration: { at: 6, pattern: [70, 40, 150] },
}
```
Only `id` is required. A scene's voice and sound effects fade out when the scene ends; ambience carries over to the next scene unless you set `ambience: null` (fade out) or give a different file.

### Replace media
Put files in `public/media/images` and `public/media/audio`, then change the paths in `scenes.js`. Images: WebP/JPEG, ideally under 400 KB for phones. Audio: MP3 (or AAC/OGG). Keep ambience loops short (about 10 to 60 seconds): audio is decoded into memory for exact sync.
The demo placeholders (clearly labelled) are produced by `python3 tools/make-placeholders.py`.

### Edit timing
Change `duration`, `delay` and each cue's `at` / `duration` (all seconds). Scenes chain automatically, so changing one duration shifts everything after it. `intensity` (per scene or per effect) scales effect strength; `volume` scales the scene's sounds.

### Add vibration
`vibration: { at: 6, pattern: [70, 40, 150] }` (buzz 70 ms, pause 40 ms, buzz 150 ms) or a list of such objects, or just a number of milliseconds. It works on Android Chrome/Firefox only. **iOS Safari has no Vibration API**, desktops ignore it; there it silently does nothing. Cues are capped (1.5 s max) and spaced at least 150 ms apart, and are skipped when the visitor prefers reduced motion.

### Cloudinary (or any CDN) later
Set `settings.mediaBase` in `scenes.js`, or the `MEDIA_BASE` environment variable, to your **public delivery** base URL, e.g. `https://res.cloudinary.com/<cloud>/`. Paths in scenes then resolve against it. Never put an API key or secret in this repo. The CDN must send CORS headers, because audio is fetched and decoded (Cloudinary does; if not, the scene just plays silently).

### Your own effects
Write a function in `src/data/customEffects.js` and reference it with `custom: [{ name: 'heartbeat', at: 3 }]`. It receives the master timeline and a small API (see comments in that file).

## Effects reference
Use these names in `entranceEffect`, `exitEffect`, `imageEffect`, `effects: [{ effect, at, duration, intensity }]`, and text `effect` / `exit`.

- **Image:** `fade`, `suddenReveal`, `blurIn`, `fadeOut`, `darkFade`, `blurOut`, `cut`, `zoomIn`, `zoomOut`, `slowZoom`, `drift`, `rotate`, `shake`, `distortion`, `glitch`, `flash`, `blur`, `chromatic`, `burn`, `crack`
- **Screen:** `flash`, `blackout`, `unblack`, `vignettePulse`, `grainBurst`, `screenBlur`, `cameraShake`, `screenDistortion`, `glitch`, `chromatic`, `noise`
- **Text (in):** `fade`, `scaleBurst`, `blurToSharp`, `suddenAppear`, `cinematicReveal`, `typeOn`, `letterSpacing`, `shake`, `glitch`, `distortion`
- **Text (out):** `fade`, `blurOut`, `cut`, `dissolve`
- **Text styles:** `caption`, `whisper`, `title`, `impact`. **Positions:** `center`, `top`, `upper`, `lower`, `bottom`.
- Shortcuts on a scene: `shake` (camera), `glitch`, `flash`, `blur`, `zoom`, `rotation`, `darkness`, `overlay`.

`burn` and `crack` are purely visual overlays (a small canvas and clipped copies of the picture); the original file is never touched. Two effects that change the same property at the same time (for example two scale effects) will fight each other, so use one.

## Performance, mobile and accessibility
- Animations use transform and opacity (short blurs only where named). React renders the stage once; GSAP drives it through refs.
- `dvh` units, safe-area insets, `object-fit` for 9:16 and 16:9 photos, text that wraps and scales (`clamp`) in portrait and landscape.
- `prefers-reduced-motion`: shaking, flashing, glitch, zoom and haptics are dropped; entrances and exits become simple fades.
- Controls (pause, sound, vibration where supported, replay) are subtle, auto-hide, and reappear on tap, mouse move or focus. Space pauses, M mutes. The password field and all controls are keyboard accessible with visible focus.
- The tab hiding or an audio interruption (phone call) pauses the sequence so sound and picture never drift apart. The screen is kept awake while playing where supported.
- The sequence contains flashes and sudden sound; the START screen warns about it. Lower `intensity` or remove `flash` cues for sensitive viewers.

## Deploy on Render
Use a **Web Service** (not a Static Site). `render.yaml` is included.
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
- Env vars: `FLASHBACK_PASSWORD` (set manually in the dashboard), `SESSION_SECRET` (auto-generated by `render.yaml`), optional `MEDIA_BASE`.
- **Free tier:** the service sleeps after about 15 minutes idle, so the first visit can take roughly 30 to 60 seconds to wake. Open the link once before showing it to someone.

## Security notes
- The password is never in the JS bundle. The scene text, timing and media paths are sent only after login (`/api/scenes`), not bundled.
- In production, local `/media/*` files are served only with a valid login cookie. Media on an external CDN (Cloudinary etc.) is **not strictly secret**: anyone who has the URL can fetch it.
- `scenes.js` must stay plain data (the server warns at startup if it finds functions).
- The rate limiter is in memory (resets on restart; fine for a single small instance).

## Structure
```
server/index.js              Express: auth, protected /api/scenes and /media, serves the built site
src/data/scenes.js           YOUR scenes (edit this)
src/data/customEffects.js    your own effects (optional)
src/engine/                  sceneConfig, buildTimeline (master timeline), Playback, AudioManager,
                             HapticManager, MediaLoader, stage helpers, effects/ (registry + effect files)
src/components/              PasswordScreen, FlashbackExperience, SceneRenderer, ImageLayer, TextLayer,
                             Effects, LoadingScreen, StartGate, Controls, Grain
src/hooks/                   useEngine, useMasterTimeline, useAutoHide, useWakeLock
src/utils/                   audio (password-screen sounds), haptics, motion, url, async
src/styles/                  global.css (gate), cinema.css (experience)
public/media/                placeholder pictures and sounds
tools/make-placeholders.py   regenerates the placeholders
```
