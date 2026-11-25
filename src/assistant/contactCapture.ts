/*
  Contact details, picked out of what the visitor says to the assistant (typed or spoken).

    "my name is Aisha, my number is +971 50 123 4567"  → { name: 'Aisha', phone: '+971501234567' }
    "aisha@gulfkitchens.ae"                            → { email: 'aisha@gulfkitchens.ae' }
    "Aisha Khan"  (just after she asked for a name)    → { name: 'Aisha Khan' }

  assistant.ts sends what is found to POST /v1/public/sessions/{id}/contact (WEBSITE_API.md §3 item 5),
  instead of showing a form. Nothing is ticked for the visitor: the WhatsApp and email opt-ins go as
  false, because consent is only ever recorded with the exact words a visitor agreed to (D59).
*/

export type ContactFields = { name?: string; company?: string; phone?: string; email?: string };
export type Expecting = Partial<Record<keyof ContactFields, boolean>>;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// a phone: optional + or 00, then digits with spaces, dots, dashes or brackets between them
const PHONE = /(?:\+|00)?\d[\d\s().-]{5,20}\d/g;
// numbers that are quantities or sizes, not phones ("5000 pieces", "10,000 cartons", "30 cm")
const NOT_PHONE_AFTER = /^\s*(pcs|pieces|piece|pc|cartons?|ctns?|units?|boxes|packs?|kg|g|ml|cc|cm|mm|rolls?|aed|dhs?|qty|قطعة|كرتون)\b/i;

// words that follow "I am / I'm" but are not names
const NOT_A_NAME = new Set(
  ('a an the not just also here there looking interested trying searching going from in at on with ok okay fine good great ' +
    'sure ready available new happy glad sorry back calling writing asking planning thinking working buying ordering ' +
    'for what it too perfect nice very exactly urgent about restaurant bakery hotel caterer distributor company business owner manager chef buyer customer client ' +
    'interested need want would like hi hello hey yes no thanks thank please').split(' '),
);
// a short reply that is not a name even when a name was asked for
const NOT_A_REPLY = /^(hi|hello|hey|yes|no|ok|okay|sure|thanks|thank you|later|why|what|skip|not now|no thanks|na|nah|مرحبا|نعم|لا|شكرا)$/i;

// words that never appear in a person's name: a request or a product, not an answer to "your name?"
const NOT_IN_NAME = new Set(
  ('show open find need want give send price prices cost how what where when which do does can could is are please me us you ' +
    'foil container containers lid lids cup cups tray trays platter platters pot pots film cling cutlery spoon spoons fork forks ' +
    'knife knives microwave quote quotation products product sample samples catalogue size sizes carton cartons').split(' '),
);
const clean = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/[.,;:!?،]+$/, '');
const titleCase = (s: string) => s.replace(/\b([a-z])/g, (c) => c.toUpperCase());

function findPhone(text: string): string | undefined {
  for (const m of text.matchAll(PHONE)) {
    const raw = m[0];
    const digits = raw.replace(/\D/g, '');
    const intl = /^(\+|00)/.test(raw);
    // 8–15 digits (7 with a country prefix); never a quantity or a size
    if (digits.length < (intl ? 7 : 8) || digits.length > 15) continue;
    if (NOT_PHONE_AFTER.test(text.slice((m.index || 0) + raw.length))) continue;
    return (raw.trim().startsWith('+') ? '+' : raw.trim().startsWith('00') ? '+' : '') + (raw.trim().startsWith('00') ? digits.slice(2) : digits);
  }
  return undefined;
}

function findName(text: string, expecting: boolean): string | undefined {
  const words = (s: string) => s.split(/\s+(?:and|from|at|with|of|my|phone|number|email|here|و|من)\b/i)[0];
  // said outright: "my name is …", "name: …", "call me …", "this is … from …", Arabic "اسمي …"
  const said =
    text.match(/\b(?:my name is|my name's|name is|name\s*:|call me)\s+([A-Za-zÀ-ɏ][A-Za-zÀ-ɏ.'-]*(?:\s+[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ.'-]*){0,3})/i) ||
    text.match(/(?:اسمي|إسمي)\s+([\u0600-\u06FF]+(?:\s+(?!و?(?:رقم|هاتف|جوال|ايميل|إيميل|بريد|من|في))[\u0600-\u06FF]+){0,2})/);
  if (said) {
    const n = clean(words(said[1]));
    if (n && !NOT_A_NAME.has(n.split(' ')[0].toLowerCase())) return /[a-z]/.test(n) && n === n.toLowerCase() ? titleCase(n) : n;
  }
  // "I'm Aisha" / "This is Aisha": only a capitalised word that isn't a common word, or when a name was asked for
  const iam = text.match(/\b(?:i am|i'm|im|this is)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,2})/i);
  if (iam) {
    const n = clean(words(iam[1]));
    const first = n.split(' ')[0];
    if (n && !NOT_A_NAME.has(first.toLowerCase()) && (/^[A-Z]/.test(first) || expecting)) return titleCase(n);
  }
  // the whole reply is a name, just after she asked for one: one to three words, letters only
  if (expecting) {
    const t = clean(text.replace(EMAIL, '').replace(PHONE, ''));
    if (t && !NOT_A_REPLY.test(t) && /^[A-Za-zÀ-ɏ؀-ۿ][A-Za-zÀ-ɏ؀-ۿ.'-]*(?:\s+[A-Za-zÀ-ɏ؀-ۿ][A-Za-zÀ-ɏ؀-ۿ.'-]*){0,2}$/.test(t)) {
      if (!NOT_A_NAME.has(t.split(' ')[0].toLowerCase()) && !t.toLowerCase().split(' ').some((w) => NOT_IN_NAME.has(w))) return /[a-z]/.test(t) && t === t.toLowerCase() ? titleCase(t) : t;
    }
  }
  return undefined;
}

function findCompany(text: string, expecting: boolean): string | undefined {
  const m = text.match(/\b(?:my company is|our company is|company name is|company is|company\s*:|i work (?:at|for)|we are)\s+([A-Za-z0-9][\w&.'-]*(?:\s+[A-Za-z0-9&][\w&.'-]*){0,4})/i);
  if (m) {
    const c = clean(m[1].split(/\s+(?:and|my|phone|number|email)\b/i)[0]);
    if (c && !NOT_A_NAME.has(c.toLowerCase())) return c;
  }
  if (expecting && !EMAIL.test(text) && !findPhone(text)) {
    const t = clean(text);
    if (t && t.split(' ').length <= 5 && !NOT_A_REPLY.test(t)) return t;
  }
  return undefined;
}

/** the contact details in one thing the visitor said; `expecting` = what the assistant has just asked for */
export function extractContact(text: string, expecting: Expecting = {}): ContactFields {
  const out: ContactFields = {};
  const email = text.match(EMAIL)?.[0];
  if (email) out.email = email.toLowerCase();
  const phone = findPhone(text.replace(EMAIL, ' '));
  if (phone) out.phone = phone;
  // a lone reply to "your company?" is the company; to "your name?" the name
  const company = findCompany(text, !!expecting.company && !expecting.name);
  if (company) out.company = company;
  const name = findName(text, !!expecting.name);
  if (name && name !== out.company) out.name = name;
  return out;
}

/** what the assistant's own line asks for ("May I have your name and phone number?") */
export function askedFor(line: string): Expecting {
  const s = line.toLowerCase();
  return {
    name: /\b(your|full) name\b|who (am i|i'm) speaking|اسمك|الاسم/.test(s),
    phone: /\b(phone|mobile|whatsapp|number|contact)\b|رقم|هاتف|جوال|واتساب/.test(s),
    email: /\be-?mail\b|بريد/.test(s),
    company: /\b(company|business name|organisation|organization)\b|شركة/.test(s),
  };
}
