// A stand-in for the Arifa backend's four website endpoints (WEBSITE_API.pdf), for trying the site
// without the real API: node scripts/mock-arifa-api.mjs  → http://localhost:4011
// then in .env.local: NEXT_PUBLIC_ARIFA_API_URL=http://localhost:4011
//
// It answers like the real API, shapes and errors included. Type these in a chat message to see
// how the site handles the backend's failures: "429" (too many requests), "503" (assistant
// unavailable), "handover" (a person takes over); or start it with FAIL=503 to fail every turn. Live voice can't be mocked (no LiveKit room):
// /voice answers 422 "text_only", so the site falls back to the browser's own speech.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 4011);
const sessions = new Map(); // id → { token, voice_consent, language, expires }

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, {
    'content-type': type,
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const problem = (res, status, reason, title) => send(res, status, { type: 'about:blank', title, status, detail: title, reason }, 'application/problem+json');
const read = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch { r(null); } }); });

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = new URL(req.url, 'http://x');
  const body = await read(req);
  if (body === null) return send(res, 422, { detail: [{ msg: 'invalid JSON' }] });

  if (req.method === 'POST' && url.pathname === '/v1/public/sessions') {
    const id = randomUUID();
    const s = { token: randomUUID(), voice_consent: !!body.voice_consent, language: body.language || 'en', expires: Date.now() + 2 * 3600e3 };
    sessions.set(id, s);
    console.log('session', id, s.voice_consent ? '(voice consent)' : '');
    return send(res, 201, { session_id: id, session_token: s.token, expires_at: new Date(s.expires).toISOString(), language: s.language, voice_available: s.language !== 'si' });
  }

  const m = url.pathname.match(/^\/v1\/public\/sessions\/([^/]+)\/(messages|voice|identify)$/);
  if (req.method !== 'POST' || !m) return problem(res, 404, 'not_found', 'Not found');
  const s = sessions.get(m[1]);
  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!s || s.expires < Date.now()) return problem(res, 401, 'expired', 'Session missing or expired');
  if (auth !== s.token) return problem(res, 403, 'forbidden', 'The token belongs to another session');

  if (m[2] === 'messages') {
    const text = String(body.text || '').trim();
    if (!text || text.length > 2000) return send(res, 422, { detail: [{ loc: ['body', 'text'], msg: 'length 1–2000' }] });
    if (body.language) s.language = body.language;
    if (process.env.FAIL) return problem(res, Number(process.env.FAIL), 'forced', `Forced ${process.env.FAIL} (FAIL=…)`);
    if (text === '429') return problem(res, 429, 'rate_limited', 'Too many requests');
    if (text === '503') return problem(res, 503, 'unavailable', 'The assistant is unavailable');
    const ar = s.language === 'ar';
    if (/handover/i.test(text)) return send(res, 200, { reply: null, language: s.language, handed_over: true });
    const reply = ar
      ? `(تجريبي) وصلتني رسالتك: «${text}». ما الكمية التي تحتاجها تقريباً؟`
      : `(mock) I got your message: "${text}".\nRoughly how many cartons do you need?`;
    return send(res, 200, { reply, language: s.language, handed_over: false });
  }
  if (m[2] === 'voice') {
    if (!s.voice_consent) return problem(res, 422, 'no_voice_consent', 'Session started without voice consent');
    return problem(res, 422, 'text_only', 'Voice is not configured on the mock');
  }
  // identify: always ok, unless the details don't look right
  const okPhone = !body.phone || String(body.phone).replace(/\D/g, '').length >= 7;
  const okEmail = !body.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email);
  if (!okPhone || !okEmail) return problem(res, 422, 'invalid', 'The phone or email does not look right');
  console.log('identify', m[1], body);
  return send(res, 200, { ok: true });
}).listen(PORT, () => console.log(`Mock Arifa API on http://localhost:${PORT}`));
