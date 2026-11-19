/*
  The Arifa website API (the backend's /v1/public endpoints; hand-off doc: WEBSITE_API.pdf).

  The four calls:
    POST /v1/public/sessions                       start a conversation (Turnstile-checked)
    POST /v1/public/sessions/{id}/messages         one chat turn
    POST /v1/public/sessions/{id}/voice            a LiveKit room token for live voice
    POST /v1/public/sessions/{id}/identify         the visitor typed their phone or email

  Switched on by NEXT_PUBLIC_ARIFA_API_URL (e.g. https://api.arifapack.com, or
  http://localhost:4011 for the mock). Without it the assistant keeps its built-in brain.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY is the Cloudflare Turnstile widget's key; without it the token
  is sent empty, which only a local backend (no Turnstile secret) accepts.

  The browser calls the API directly (not through our server), so the backend's per-visitor
  limits see each visitor's own address. The backend must allow this site's origin (CORS).

  The session token lives in sessionStorage for this tab only (2 hours). A visitor is never
  recognised silently: identify() is only called with details they typed themselves.
*/

const BASE = (process.env.NEXT_PUBLIC_ARIFA_API_URL || '').replace(/\/+$/, '');
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const KEY = 'arifa-api-session';

export const apiEnabled = () => !!BASE;

export type Session = {
  session_id: string;
  session_token: string;
  expires_at: string;
  language: string;
  voice_available: boolean;
  voice_consent: boolean; // (ours: whether it was started with voice consent)
};
export type MessageOut = { reply: string | null; language: string; handed_over: boolean };
export type VoiceOut = { livekit_url: string; token: string; room: string; language: string; expires_at: string };

/** a refused call: the HTTP status and, for business errors, the problem+json `reason` */
export class ApiError extends Error {
  constructor(public status: number, public reason: string | null = null, message = '') {
    super(message || `Arifa API ${status}${reason ? ` (${reason})` : ''}`);
  }
}

// ── Cloudflare Turnstile: an invisible widget, run once per token we need ──
let turnstileReady: Promise<any> | null = null;
function loadTurnstile() {
  if (!SITE_KEY) return Promise.resolve(null);
  turnstileReady ||= new Promise((resolve, reject) => {
    if ((window as any).turnstile) { resolve((window as any).turnstile); return; }
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve((window as any).turnstile);
    s.onerror = () => { turnstileReady = null; reject(new ApiError(403, 'turnstile_unavailable')); };
    document.head.appendChild(s);
  });
  return turnstileReady;
}
let widgetId: string | null = null;
async function turnstileToken(): Promise<string> {
  const ts = await loadTurnstile();
  if (!ts) return '';
  let box = document.getElementById('arifa-turnstile');
  if (!box) {
    box = document.createElement('div');
    box.id = 'arifa-turnstile';
    box.style.cssText = 'position:fixed;left:-9999px;bottom:0;'; // invisible mode: nothing to see
    document.body.appendChild(box);
  }
  return new Promise((resolve, reject) => {
    const opts = {
      sitekey: SITE_KEY,
      size: 'invisible',
      execution: 'execute',
      callback: (token: string) => resolve(token),
      'error-callback': () => reject(new ApiError(403, 'turnstile_failed')),
      'expired-callback': () => reject(new ApiError(403, 'turnstile_expired')),
    };
    try {
      if (widgetId) ts.remove(widgetId);
      widgetId = ts.render(box, opts);
      ts.execute(widgetId);
    } catch {
      reject(new ApiError(403, 'turnstile_failed'));
    }
  });
}

// ── the session, kept for this tab ──
const load = (): Session | null => {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return s && new Date(s.expires_at).getTime() - Date.now() > 60_000 ? s : null; // (a minute's margin)
  } catch { return null; }
};
const store = (s: Session | null) => {
  try { s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY); } catch { /* private mode */ }
};
export const currentSession = () => load();

async function call<T>(path: string, body: unknown, token?: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError(0, 'network', 'The Arifa API could not be reached.');
  }
  if (r.ok) return r.json() as Promise<T>;
  let reason: string | null = null;
  try { const p = await r.json(); reason = p?.reason ?? null; } catch { /* no body */ }
  throw new ApiError(r.status, reason);
}

/** start a new conversation (§6 step 1). `voiceConsent`: the visitor chose to talk (the mic). */
export async function startSession({ voiceConsent = false, language }: { voiceConsent?: boolean; language?: string } = {}) {
  const out = await call<Omit<Session, 'voice_consent'>>('/v1/public/sessions', {
    turnstile_token: await turnstileToken(),
    language: language ?? null,
    voice_consent: voiceConsent,
    cookie_consent: false, // (the site sets no tracking cookies)
    country_code: null,
  });
  const s = { ...out, voice_consent: voiceConsent };
  store(s);
  return s;
}

/** the tab's conversation, started if there isn't one (or it has expired) */
export async function ensureSession(opts: { voiceConsent?: boolean; language?: string } = {}) {
  const s = load();
  if (s && (!opts.voiceConsent || s.voice_consent)) return s;
  return startSession(opts);
}

// a call that needs the session: a 401 (expired) or 403 (Turnstile / another session's token)
// starts a fresh session and tries once more
async function withSession<T>(fn: (s: Session) => Promise<T>, opts: { voiceConsent?: boolean; language?: string } = {}): Promise<T> {
  const s = await ensureSession(opts);
  try {
    return await fn(s);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      store(null);
      return fn(await startSession(opts));
    }
    throw e;
  }
}

/** one chat turn (§6 steps 2–6). `reply` may be null: a person has the conversation now. */
export function sendMessage(text: string, { language, voiceConsent = false }: { language?: string; voiceConsent?: boolean } = {}) {
  return withSession(
    (s) => call<MessageOut>(`/v1/public/sessions/${s.session_id}/messages`, { text: text.slice(0, 2000), language: language ?? null }, s.session_token),
    { voiceConsent, language },
  );
}

/** a LiveKit room for live voice. Throws ApiError 422 'text_only' when the language has no voice. */
export async function voiceRoom({ language }: { language?: string } = {}) {
  try {
    return await withSession((s) => call<VoiceOut>(`/v1/public/sessions/${s.session_id}/voice`, {}, s.session_token), { voiceConsent: true, language });
  } catch (e) {
    // the session began without voice consent: the mic tap is that consent, so start one with it
    if (e instanceof ApiError && e.status === 422 && e.reason === 'no_voice_consent') {
      store(null);
      const s = await startSession({ voiceConsent: true, language });
      return call<VoiceOut>(`/v1/public/sessions/${s.session_id}/voice`, {}, s.session_token);
    }
    throw e;
  }
}

/** the visitor typed their phone or email (§6 step 7). Always { ok: true }; 422 'invalid' = doesn't look right. */
export function identify(who: { phone?: string; email?: string; name?: string }, { language }: { language?: string } = {}) {
  const body = { phone: who.phone || null, email: who.email || null, name: who.name || null };
  if (!body.phone && !body.email) return Promise.resolve({ ok: true });
  return withSession((s) => call<{ ok: boolean }>(`/v1/public/sessions/${s.session_id}/identify`, body, s.session_token), { language });
}
