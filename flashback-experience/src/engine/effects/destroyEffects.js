// "Destroy" effects: burn and crack. 100% visual overlays; the image file is never modified.
//
// burn  -> a tiny canvas (128x72 cells) is scaled up by the browser and paints black "ash" over the
//          picture with a pale glowing edge. Cheap: only ~9k pixels are rewritten per frame.
// crack -> thin crack lines draw out from an impact point, then the picture breaks into 16 clipped
//          shards (copies of the image) that fall away. Shards exist only while the effect runs.
//
// Both drive a single number (state.p, 0 to 1) so they stay correct when paused, resumed or replayed.
import gsap from 'gsap';
import { fx, LATER, rng, clamp01, smoothstep } from './helpers.js';

// ---------------------------------------------------------------- burn
const W = 128, H = 72, EDGE = 0.1;
const EDGE_COLOR = [214, 240, 255]; // cold white-blue glow, matches the single cold accent

function buildBurnField(seed) {
  const r = rng(seed);
  const layers = [[6, 4, 0.55], [12, 7, 0.3], [24, 14, 0.15]].map(([gw, gh, amp]) => ({
    gw, gh, amp, v: Float32Array.from({ length: (gw + 1) * (gh + 1) }, () => r()),
  }));
  const ox = 0.3 + 0.4 * r(), oy = 0.35 + 0.3 * r(); // where the fire starts
  const field = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let n = 0;
      for (const { gw, gh, amp, v } of layers) {
        const gx = (x / W) * gw, gy = (y / H) * gh;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const tx = smoothstep(0, 1, gx - x0), ty = smoothstep(0, 1, gy - y0);
        const i = y0 * (gw + 1) + x0;
        const top = v[i] + (v[i + 1] - v[i]) * tx;
        const bot = v[i + gw + 1] + (v[i + gw + 2] - v[i + gw + 1]) * tx;
        n += amp * (top + (bot - top) * ty);
      }
      const dist = Math.hypot(((x / W) - ox) * 1.78, (y / H) - oy) / 1.35;
      field[y * W + x] = clamp01(n * 0.62 + dist * 0.38);
    }
  }
  return field;
}

export const burn = fx((el, k, { duration, refs }) => {
  const canvas = refs.burn;
  if (!canvas?.getContext) return gsap.to({}, { duration });
  const ctx2d = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const field = buildBurnField(23);
  const frame = ctx2d.createImageData(W, H);
  const state = { p: 0 };

  const draw = () => {
    const t = state.p * (1 + EDGE);
    const px = frame.data;
    for (let i = 0; i < field.length; i++) {
      const d = t - field[i];
      const o = i * 4;
      if (d <= 0) { px[o + 3] = 0; continue; }
      if (d >= EDGE) { px[o] = px[o + 1] = px[o + 2] = 0; px[o + 3] = 255; continue; }
      const e = d / EDGE; // 0 at the burning front, 1 once fully ash
      px[o] = EDGE_COLOR[0] * (1 - e); px[o + 1] = EDGE_COLOR[1] * (1 - e); px[o + 2] = EDGE_COLOR[2] * (1 - e);
      px[o + 3] = 255 * Math.min(1, e * 1.6 + 0.25 * (1 - e));
    }
    ctx2d.putImageData(frame, 0, 0);
  };
  const reset = () => { canvas.style.opacity = '0'; };

  return gsap.to(state, {
    p: 1, duration, ease: 'power1.in',
    onStart: () => { canvas.style.opacity = '1'; draw(); },
    onUpdate: draw, onReverseComplete: reset, ...LATER,
  });
}, 2.4);

// ---------------------------------------------------------------- crack
const SPLIT = 0.28;          // first 28% of the effect = cracks appear, then it breaks
const ANGLES = 8;

function buildShardPolygons(cx, cy, seed) {
  const r = rng(seed);
  const angles = Array.from({ length: ANGLES }, (_, i) => ((i + (r() - 0.5) * 0.7) / ANGLES) * Math.PI * 2);
  const pt = (a, radius) => [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.75];
  const inner = 22 + r() * 8, outer = 190;
  const shards = [];
  for (let i = 0; i < ANGLES; i++) {
    const a = angles[i], b = angles[(i + 1) % ANGLES];
    shards.push({ pts: [[cx, cy], pt(a, inner), pt(b, inner)], mid: (a + b) / 2 + (b < a ? Math.PI : 0) });
    shards.push({ pts: [pt(a, inner), pt(a, outer), pt(b, outer), pt(b, inner)], mid: (a + b) / 2 + (b < a ? Math.PI : 0) });
  }
  return shards;
}

const polygonCss = (pts) => `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(',')})`;

export const crack = fx((el, k, { duration, refs }) => {
  const host = refs.shards;
  if (!host) return gsap.to({}, { duration });
  const r = rng(41);
  const cx = 44 + r() * 12, cy = 38 + r() * 14;
  const polys = buildShardPolygons(cx, cy, 9);
  const state = { p: 0 };
  let broken = false, shards = [], svg = null, lines = [];

  const makeLines = () => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'crack-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    const lr = rng(77);
    lines = Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2 + lr() * 0.4;
      let x = cx, y = cy;
      const pts = [[x, y]];
      for (let s = 0; s < 6; s++) {
        const step = 6 + lr() * 9, wob = (lr() - 0.5) * 0.9;
        x += Math.cos(a + wob) * step; y += Math.sin(a + wob) * step * 0.8;
        pts.push([x, y]);
      }
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#e8f6ff');
      path.setAttribute('stroke-width', '0.35'); path.setAttribute('stroke-linejoin', 'round');
      svg.append(path);
      return { path, pts };
    });
    host.append(svg);
  };

  // Draws the first `amount` (0..1) of each crack by extending its polyline.
  const drawLines = (amount) => {
    lines.forEach(({ path, pts }, i) => {
      const reach = clamp01(amount * 1.4 - i * 0.03) * (pts.length - 1);
      const whole = Math.floor(reach), frac = reach - whole;
      const out = pts.slice(0, whole + 1);
      if (whole < pts.length - 1 && frac > 0) {
        const [x0, y0] = pts[whole], [x1, y1] = pts[whole + 1];
        out.push([x0 + (x1 - x0) * frac, y0 + (y1 - y0) * frac]);
      }
      path.setAttribute('d', out.length > 1 ? `M${out.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')}` : '');
    });
  };

  const clean = () => {
    shards.forEach((s) => s.node.remove()); shards = [];
    svg?.remove(); svg = null; lines = [];
    host.querySelectorAll('.shard, .crack-svg').forEach((n) => n.remove());
    broken = false;
    el.style.opacity = '';
  };

  const makeShards = () => {
    const img = el.querySelector('img');
    const sr = rng(5);
    shards = polys.map(({ pts, mid }) => {
      const node = document.createElement('div');
      node.className = 'shard';
      node.style.clipPath = polygonCss(pts);
      node.style.webkitClipPath = polygonCss(pts);
      if (img) { const c = img.cloneNode(); c.setAttribute('aria-hidden', 'true'); node.append(c); }
      host.insertBefore(node, svg);
      const dist = Math.hypot(pts[0][0] - cx, pts[0][1] - cy);
      return { node, dx: Math.cos(mid), dy: Math.sin(mid), spin: (sr() * 2 - 1) * 40, speed: 0.6 + sr() * 0.8, delay: Math.min(0.35, dist / 300) };
    });
  };

  const update = () => {
    const p = state.p;
    if (p < SPLIT) {
      if (broken) clean();
      if (!svg) makeLines();
      drawLines(p / SPLIT);
      return;
    }
    if (!svg) makeLines();
    if (!broken) { makeShards(); broken = true; el.style.opacity = '0'; drawLines(1); }
    const q = (p - SPLIT) / (1 - SPLIT);
    shards.forEach((s) => {
      const t = clamp01((q - s.delay) / (1 - s.delay));
      const x = s.dx * 26 * s.speed * t, y = s.dy * 16 * s.speed * t + 120 * t * t;
      s.node.style.transform = `translate3d(${x}%,${y}%,0) rotate(${s.spin * t}deg)`;
      s.node.style.opacity = String(1 - smoothstep(0.55, 1, t));
    });
    svg.style.opacity = String(1 - smoothstep(0, 0.35, q));
  };

  return gsap.to(state, {
    p: 1, duration, ease: 'none',
    onStart: () => { clean(); update(); }, onUpdate: update, onReverseComplete: clean, ...LATER,
  });
}, 1.8);
