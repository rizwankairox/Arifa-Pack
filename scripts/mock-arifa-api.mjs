// A stand-in for the Arifa backend's website endpoints (sessions, messages, voice, identify, contact,
// events, enquiries) (WEBSITE_API.pdf), for trying the site
// without the real API: node scripts/mock-arifa-api.mjs  → http://localhost:4011
// then in .env.local: NEXT_PUBLIC_ARIFA_API_URL=http://localhost:4011
//
// It answers like the real API, shapes and errors included. Type these in a chat message to see
// how the site handles the backend's failures: "429" (too many requests), "503" (assistant
// unavailable), "handover" (a person takes over); or start it with FAIL=503 to fail every turn. Live voice can't be mocked (no LiveKit room):
// /voice answers 422 "text_only", so the site falls back to the browser's own speech.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

// the catalogue, so the mock can name real products (show_product)
let catalogue = { products: [] };
try { catalogue = JSON.parse(readFileSync(new URL('../src/data/catalogue.json', import.meta.url), 'utf8')); } catch { /* none */ }

// a few of the backend's "instant layer" rules: family words, product numbers, pages, the factory
const FAMILIES = [
  ['cling-film', /cling|stretch film|سلوفان/i], ['foil', /foil|ورق/i], ['cutlery', /cutlery|spoon|fork|ملاعق/i],
  ['microwave', /microwave|plastic|مايكرويف/i], ['platters', /platter|صوان/i], ['cups-trays', /\bcups?\b|\btrays?\b|أكواب/i],
  ['pots', /\bpots?\b|قدور/i], ['containers', /container|حاويات/i],
];
const act = (id, type, extra, path, anchor = null) => ({ id, layer: 'instant', type, ...extra, resolved: { path_en: path, path_ar: path === '/' ? '/ar' : `/ar${path}`, anchor } });
function actionsFor(text) {
  const out = [];
  const num = text.match(/\b(\d{4,6})\b/)?.[1];
  const prod = num && (catalogue.products.find((p) => p.ref.replace(/\s.*/, '') === num && p.range !== 'self') || catalogue.products.find((p) => p.ref.startsWith(num)));
  if (prod) out.push(act(`p-${prod.id}`, 'show_product', { product_id: prod.id, view: 'quick' }, `/products/${prod.id}`));
  else {
    const fam = FAMILIES.find(([, re]) => re.test(text))?.[0];
    if (fam) out.push(act(`f-${fam}`, 'show_family', { family: fam }, `/products?family=${fam}`));
  }
  if (/certificate|شهادات/i.test(text)) out.push(act('n-docs', 'navigate', { page: 'quality', section: 'documents' }, '/quality', 'documents'));
  if (/factory|مصنع/i.test(text)) out.push(act('t-factory', 'factory_tour', { chapter: null }, '/', 'factory'));
  if (/contact|quote|details|عرض سعر/i.test(text)) out.push({ id: 'ask-1', layer: 'agent', type: 'ask_contact', fields: ['name', 'phone', 'email'], consents: ['whatsapp', 'email'] });
  return out;
}
// one turn, as JSON or streamed (Accept: text/event-stream): action … delta … done
function answer(req, res, turn) {
  if (!(req.headers.accept || '').includes('text/event-stream')) return send(res, 200, turn);
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
  const ev = (name, data) => res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
  (turn.actions || []).forEach((a) => ev('action', a));               // the page can move now
  setTimeout(() => {                                                    // the reply, a sentence at a time
    (turn.reply || '').split(/(?<=[.!?؟])\s+/).filter(Boolean).forEach((t, i, all) => ev('delta', { text: t + (i < all.length - 1 ? ' ' : '') }));
    ev('done', { language: turn.language, handed_over: turn.handed_over });
    res.end();
  }, 900);
}

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

  // the enquiry desk: with a session token it joins that conversation, else it needs a Turnstile token
  if (req.method === 'POST' && url.pathname === '/v1/public/enquiries') {
    if (!body.phone && !body.email) return problem(res, 422, 'empty', 'A phone or an email is required');
    if (body.session_id) {
      const s = sessions.get(body.session_id);
      const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!s || auth !== s.token) return problem(res, 401, 'expired', 'Session missing or expired');
    }
    const reference = 'W-' + randomUUID().slice(0, 6).toUpperCase();
    console.log('enquiry', reference, JSON.stringify(body));
    return send(res, 201, { ok: true, reference });
  }

  const m = url.pathname.match(/^\/v1\/public\/sessions\/([^/]+)\/(messages|voice|identify|contact|events)$/);
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
    s.spoke = true;
    const actions = actionsFor(text);
    console.log('message', JSON.stringify({ text, context: body.context }), '→', actions.map((a) => a.type).join(', ') || 'no action');
    const reply = actions.some((a) => a.type === 'ask_contact')
      ? (ar ? '(تجريبي) اترك بياناتك وسنرسل لك عرض السعر.' : '(mock) Leave your details and we’ll send the quotation.')
      : actions.length
        ? (ar ? '(تجريبي) تفضل، هذا ما طلبته.' : '(mock) Here you go. Anything else you need?')
        : (ar ? `(تجريبي) وصلتني رسالتك: «${text}». ما الكمية التي تحتاجها تقريباً؟` : `(mock) I got your message: "${text}".\nRoughly how many cartons do you need?`);
    return answer(req, res, { reply, language: s.language, handed_over: false, actions });
  }
  if (m[2] === 'voice') {
    if (!s.voice_consent) return problem(res, 422, 'no_voice_consent', 'Session started without voice consent');
    return problem(res, 422, 'text_only', 'Voice is not configured on the mock');
  }
  if (m[2] === 'events') {
    const types = ['page_view', 'product_open', 'product_dwell', 'enquiry_add', 'idle'];
    if (!types.includes(body.type) || !body.context) return send(res, 422, { detail: [{ msg: 'type and context are required' }] });
    console.log('event', body.type, body.seconds ?? '', JSON.stringify(body.context));
    s.nudges = s.nudges || 0;
    // the real backend nudges only after the visitor has spoken, at most 3 times a visit
    if (s.spoke && s.nudges < 3 && (body.type === 'product_dwell' || body.type === 'enquiry_add' || body.type === 'idle')) {
      s.nudges++;
      const id = body.context.quick_view_id || body.context.product_id || '';
      const reply = body.type === 'product_dwell' ? `(mock) Want the sizes and packing for ${id}?`
        : body.type === 'enquiry_add' ? '(mock) Added. Shall I send the quotation to you?' : '(mock) Need a hand with the enquiry?';
      return send(res, 200, { reply, actions: body.type === 'enquiry_add' ? [{ id: 'ask-2', layer: 'agent', type: 'ask_contact', fields: ['name', 'phone', 'email'], consents: ['whatsapp', 'email'] }] : [] });
    }
    return send(res, 200, { reply: null, actions: [] });
  }
  // identify and contact: always ok, unless the details don't look right
  const okPhone = !body.phone || String(body.phone).replace(/\D/g, '').length >= 7;
  const okEmail = !body.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email);
  if (!okPhone || !okEmail) return problem(res, 422, 'invalid', 'The phone or email does not look right');
  console.log(m[2], m[1], JSON.stringify(body));
  return send(res, 200, { ok: true });
}).listen(PORT, () => console.log(`Mock Arifa API on http://localhost:${PORT}`));
