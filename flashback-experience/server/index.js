// Tiny Express server: verifies the password and serves the built site.
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try { process.loadEnvFile(); } catch { /* no .env file: use real environment variables */ }

const { FLASHBACK_PASSWORD, SESSION_SECRET } = process.env;
const PORT = process.env.PORT || 8787;
const isProd = process.env.NODE_ENV === 'production';
const COOKIE = 'fb_session';
const SESSION_MS = 6 * 60 * 60 * 1000; // 6 hours

if (!FLASHBACK_PASSWORD || !SESSION_SECRET) {
  console.error('Missing FLASHBACK_PASSWORD or SESSION_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const sign = (v) => crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('hex');
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b)); // equal-length hashes: no length leak

const makeToken = () => {
  const exp = String(Date.now() + SESSION_MS);
  return `${exp}.${sign(exp)}`;
};
const validToken = (token = '') => {
  const [exp, sig] = token.split('.');
  return Boolean(exp && sig) && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
};
const readCookie = (req, name) =>
  (req.headers.cookie || '').split(';').map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1];

// Simple in-memory limiter: 5 wrong tries per IP per minute.
const attempts = new Map();
const WINDOW = 60_000, MAX_TRIES = 5;
const tooMany = (ip) => {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW);
  attempts.set(ip, recent);
  return recent.length >= MAX_TRIES;
};
setInterval(() => attempts.clear(), 10 * WINDOW).unref();

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.disable('x-powered-by');
app.use(express.json({ limit: '1kb' }));
app.use((req, res, next) => {
  res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/session', (req, res) => res.json({ ok: validToken(readCookie(req, COOKIE)) }));

app.post('/api/auth', (req, res) => {
  if (tooMany(req.ip)) return res.status(429).json({ ok: false, error: 'slow-down' });
  const ok = typeof req.body?.password === 'string' && safeEqual(req.body.password, FLASHBACK_PASSWORD);
  if (!ok) {
    attempts.get(req.ip).push(Date.now());
    return res.status(401).json({ ok: false });
  }
  attempts.delete(req.ip);
  res.cookie(COOKIE, makeToken(), { httpOnly: true, sameSite: 'strict', secure: isProd, maxAge: SESSION_MS, path: '/' });
  res.json({ ok: true });
});

if (isProd) {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html'))); // SPA fallback
}

app.listen(PORT, () => console.log(`API on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`));
