/*
  The Arifa website API (the backend's /v1/public endpoints; hand-off doc: WEBSITE_API.pdf).

  The calls:
    POST /v1/public/sessions                       start a conversation (Turnstile-checked)
    POST /v1/public/sessions/{id}/messages         one chat turn
    POST /v1/public/sessions/{id}/voice            a LiveKit room token for live voice
    POST /v1/public/sessions/{id}/identify         the visitor typed their phone or email
    POST /v1/public/sessions/{id}/contact          contact details the visitor gives in the chat (src/assistant/contactCapture.ts)
    POST /v1/public/sessions/{id}/events           the visitor moved (the assistant may offer help)
    POST /v1/public/enquiries                      the Contact page's enquiry desk

  Switched on by NEXT_PUBLIC_ARIFA_API_URL (e.g. https://api.arifapack.com, or
  http://localhost:4011 for the mock). Without it the assistant says she isn't available and offers WhatsApp.
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
export type MessageOut = { reply: string | null; language: string; handed_over: boolean; actions?: SiteAction[] };

/**
 * What the assistant asks the page to do (WEBSITE_API.md §2a): what to show, never how. Every action
 * was checked against the site map by the backend; `id` is the same for the same intent (do it once);
 * `resolved` holds where it lands in both languages (use the page's own).
 */
export type SiteAction = {
  id?: string;
  layer?: 'instant' | 'agent';
  resolved?: { path_en: string; path_ar: string; anchor?: string | null } | null;
} & (
  | { type: 'show_family'; family: string }
  | { type: 'show_product'; product_id: string; view?: 'quick' | 'page' }
  | { type: 'navigate'; page: string; section?: string | null }
  | { type: 'scroll_to'; section: string }
  | { type: 'factory_tour'; chapter?: string | null; seconds?: number | null }
  | { type: 'add_to_enquiry'; product_ids: string[] }
  | { type: 'fill_enquiry'; fill: Record<string, any> }
  | { type: 'ask_contact'; fields?: string[]; consents?: string[] }
);
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

/**
 * One chat turn (§6 steps 2–6), streamed: `onAction` gets each site action the moment the backend
 * knows it (live: 15–150 ms, before the reply is written), so the page can move at once. Resolves
 * with the whole turn. A backend that answers with plain JSON instead works the same way (its
 * actions are passed to `onAction` too). `reply` may be null: a person has the conversation now.
 * `context`: where the visitor is (siteContext()), sent with every message.
 */
export function sendMessage(
  text: string,
  { language, sessionLanguage, voiceConsent = false, context, onAction }: { language?: string; sessionLanguage?: string; voiceConsent?: boolean; context?: SiteContext; onAction?: (a: SiteAction) => void } = {},
) {
  // `language`: only when the visitor chose one; null lets the backend answer in the language they write in
  const body = { text: text.slice(0, 2000), language: language ?? null, context: context || siteContext() };
  return withSession((s) => streamTurn(`/v1/public/sessions/${s.session_id}/messages`, body, s.session_token, onAction), { voiceConsent, language: language ?? sessionLanguage });
}

async function streamTurn(path: string, body: unknown, token: string, onAction?: (a: SiteAction) => void): Promise<MessageOut> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network', 'The Arifa API could not be reached.');
  }
  if (!r.ok) {
    let reason: string | null = null;
    try { reason = (await r.json())?.reason ?? null; } catch { /* no body */ }
    throw new ApiError(r.status, reason);
  }
  // plain JSON (no streaming on this backend)
  if (!(r.headers.get('content-type') || '').includes('text/event-stream') || !r.body) {
    const out = (await r.json()) as MessageOut;
    (out.actions || []).forEach((a) => onAction?.(a));
    return out;
  }
  // server-sent events: action … delta … done (or error)
  const out: MessageOut = { reply: null, language: '', handed_over: false, actions: [] };
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.search(/\r?\n\r?\n/)) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i).replace(/^\r?\n\r?\n/, '');
      const event = /^event:\s*(.*)$/m.exec(block)?.[1]?.trim();
      const raw = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n');
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { continue; }
      if (event === 'action') { out.actions!.push(data); onAction?.(data); }
      else if (event === 'delta') text += data.text || '';
      else if (event === 'done') { out.language = data.language || ''; out.handed_over = !!data.handed_over; }
      else if (event === 'error') throw new ApiError(Number(data.status) || 500, data.code || null, data.message || '');
    }
  }
  out.reply = text || null;
  return out;
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

// ── where the visitor is (SiteContext): sent with events, so the assistant knows "this one" ──
export type SiteContext = {
  path: string;
  page: 'home' | 'products' | 'product' | 'about' | 'quality' | 'clients' | 'contact' | 'other';
  locale: 'en' | 'ar';
  family?: string | null;
  product_id?: string | null;
  quick_view_id?: string | null;
  section?: string | null;
  enquiry_list?: string[];
  input?: 'text' | 'voice';
};

export function siteContext(extra: Partial<SiteContext> = {}): SiteContext {
  const path = location.pathname;
  const bare = path.replace(/^\/ar(?=\/|$)/, '') || '/';
  const page: SiteContext['page'] = bare === '/' ? 'home'
    : /^\/products\/[^/]+/.test(bare) ? 'product'
      : (['products', 'about', 'quality', 'clients', 'contact'].find((p) => bare === `/${p}`) as SiteContext['page']) || 'other';
  let list: string[] = [];
  try { list = (JSON.parse(localStorage.getItem('arifa-enquiry') || '[]') || []).map((i) => i.id).slice(0, 50); } catch { /* none */ }
  const qv = document.querySelector<HTMLElement>('.qv.is-open')?.dataset.productId || null;
  // the section in the middle of the screen (its id is the one the assistant scrolls to)
  const mid = document.elementFromPoint?.(innerWidth / 2, innerHeight / 2);
  const section = mid?.closest<HTMLElement>('section[id], [id].ab-chapter')?.id || null;
  return {
    path: path.slice(0, 300),
    page,
    locale: document.documentElement.lang === 'ar' ? 'ar' : 'en',
    family: new URLSearchParams(location.search).get('family'),
    product_id: page === 'product' ? bare.split('/')[2] || null : null,
    quick_view_id: qv,
    section,
    enquiry_list: list,
    input: 'text',
    ...extra,
  };
}

/** contact details from the chat (name, company, phone, email) and the two opt-ins (sent false unless ticked). Always { ok: true }. */
export function sendContact(card: {
  name?: string; company?: string; phone?: string; email?: string;
  whatsapp_opt_in: boolean; email_opt_in: boolean; consent_wording?: string;
}) {
  const body = {
    name: card.name || null, company: card.company || null, phone: card.phone || null, email: card.email || null,
    whatsapp_opt_in: !!card.whatsapp_opt_in, email_opt_in: !!card.email_opt_in, consent_wording: card.consent_wording || null,
  };
  return withSession((s) => call<{ ok: boolean }>(`/v1/public/sessions/${s.session_id}/contact`, body, s.session_token));
}

export type EventType = 'page_view' | 'product_open' | 'product_dwell' | 'enquiry_add' | 'idle';
export type EventOut = { reply?: string | null; actions?: any[] };

/**
 * The visitor moved. Only sent once a conversation exists (we never start one just to track a
 * visit). Usually answers nothing; sometimes a short message from the assistant (a nudge).
 */
export async function sendEvent(type: EventType, { seconds, context }: { seconds?: number; context?: SiteContext } = {}): Promise<EventOut | null> {
  const s = load();
  if (!BASE || !s) return null;
  try {
    return await call<EventOut>(`/v1/public/sessions/${s.session_id}/events`, { type, context: context || siteContext(), seconds: seconds ?? null }, s.session_token);
  } catch {
    return null; // (a missed event changes nothing for the visitor)
  }
}

/** the Contact page's enquiry desk, sent to the CRM (instead of the email app). Returns its reference. */
export async function sendEnquiry(fields: Record<string, unknown>) {
  const s = load();
  const body = s
    ? { ...fields, session_id: s.session_id } // (joins the visitor's conversation, if there is one)
    : { ...fields, turnstile_token: await turnstileToken() };
  try {
    return await call<{ ok: boolean; reference: string }>('/v1/public/enquiries', body, s?.session_token);
  } catch (e) {
    // the conversation's pass has expired: send it on its own, with a fresh robot check
    if (s && e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      store(null);
      return call<{ ok: boolean; reference: string }>('/v1/public/enquiries', { ...fields, turnstile_token: await turnstileToken() });
    }
    throw e;
  }
}
