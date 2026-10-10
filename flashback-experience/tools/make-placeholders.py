"""Generates the clearly-labelled PLACEHOLDER media in public/media/.
Run:  python3 tools/make-placeholders.py   (needs: pillow numpy lameenc)
Replace the generated files with your own photos/recordings (see README)."""
import numpy as np, lameenc, os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'media')
rng = np.random.default_rng(7)

def font(size):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def placeholder_image(name, w, h, label, tint):
    noise = rng.normal(0, 5, (h, w, 1))
    base = np.clip(np.array(tint)[None, None, :] + noise, 0, 255).astype('uint8')
    im = Image.fromarray(base, 'RGB'); d = ImageDraw.Draw(im)
    m = int(min(w, h) * 0.06)
    d.rectangle([m, m, w - m, h - m], outline=(143, 184, 201), width=2)
    d.line([m, h * 0.62, w - m, h * 0.62], fill=(93, 106, 113), width=2)       # horizon
    r = int(min(w, h) * 0.12); cx, cy = w // 2, int(h * 0.38)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(201, 211, 216), width=3)  # "sun/face"
    f = font(int(min(w, h) * 0.055))
    for i, line in enumerate(['PLACEHOLDER IMAGE', label, 'replace in src/data/scenes.js']):
        tw = d.textlength(line, font=f)
        d.text(((w - tw) / 2, h * 0.10 + i * f.size * 1.5), line, font=f, fill=(201, 211, 216))
    im.save(os.path.join(OUT, 'images', name), 'WEBP', quality=60, method=6)

placeholder_image('scene-01.webp', 1280, 720, 'scene-01 (16:9)', (16, 22, 28))
placeholder_image('scene-02.webp', 720, 1280, 'scene-02 (9:16)', (24, 18, 22))

SR = 44100
def mp3(name, x, bitrate=96):
    x = np.clip(x, -1, 1); pcm = (x * 32767).astype('<i2')
    e = lameenc.Encoder(); e.set_bit_rate(bitrate); e.set_in_sample_rate(SR); e.set_channels(1); e.set_quality(5)
    open(os.path.join(OUT, 'audio', name), 'wb').write(e.encode(pcm.tobytes()) + e.flush())

def lowpass(x, k):  # crude one-pole lowpass
    y = np.zeros_like(x); a = k
    for i in range(1, len(x)): y[i] = y[i-1] + a * (x[i] - y[i-1])
    return y

def t(sec): return np.arange(int(SR * sec)) / SR

# voice-XX: soft "whisper-like" noise shaped into syllables (NOT real speech)
def voice(name, sec, syl):
    tt = t(sec); n = lowpass(rng.normal(0, 1, len(tt)), 0.18)
    env = np.zeros_like(tt)
    for s in syl:
        env += np.exp(-((tt - s[0]) ** 2) / (2 * s[1] ** 2))
    fade = np.minimum(1, np.minimum(tt / 0.1, (sec - tt) / 0.3))
    mp3(name, 0.5 * n * np.clip(env, 0, 1) * fade / (np.abs(n).max() + 1e-6) * 2.2)
voice('voice-01.mp3', 3.6, [(0.4,.12),(0.8,.1),(1.3,.14),(1.9,.1),(2.4,.13),(2.9,.1)])
voice('voice-02.mp3', 4.0, [(0.5,.14),(1.1,.12),(1.6,.1),(2.3,.15),(2.9,.1),(3.3,.12)])

# impact-01: sub thud + noise burst
tt = t(1.4); f = 120 * np.exp(-tt * 3.2) + 28
thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.0)
burst = lowpass(rng.normal(0, 1, len(tt)), 0.12) * np.exp(-tt * 14)
mp3('impact-01.mp3', 0.9 * thud + 0.5 * burst)

# ambience-01: seamless 12 s drone (every partial has a whole number of cycles in 12 s)
L = 12; tt = t(L)
amb = sum(a * np.sin(2 * np.pi * (k / L) * tt + p) for k, a, p in [(660, .30, 0), (990, .16, 1.3), (1320, .08, 2.1), (1980, .05, .6)])
amb += 0.04 * np.sin(2 * np.pi * 3 / L * tt) * np.sin(2 * np.pi * 1320 / L * tt)
mp3('ambience-01.mp3', 0.35 * amb / np.abs(amb).max())
print('placeholders written')
