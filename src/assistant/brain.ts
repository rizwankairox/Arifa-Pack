/*
  What Arifa says next.

  With an API key on the server (src/app/api/assistant/route.ts), every turn goes to
  Claude with the live catalogue. Without one — or if that call fails — a scripted
  salesperson answers instead: it qualifies the visitor the way a rep would (what
  they'll pack, how many cartons, where to deliver) and offers to start the quote.

  Either way a reply is { say, action }, where action is one of
    { type: 'family', id }  { type: 'product', ref }  { type: 'quote', fill }  { type: 'factory' }  or null.
  The conversation and what has been learned survive page changes (sessionStorage).
*/
import type { FamilyInfo, Turn } from './types';
import { isArPage, tc } from '@/i18n/client';

const KEY = 'arifa-brain';
const pick = (list) => list[Math.floor(Math.random() * list.length)];
// say the visitor's words back from her side: "my restaurant" → "your restaurant"
const reflect = (s) => isArPage() ? s : s
  .replace(/\b(my|our)\b/gi, 'your')
  .replace(/\b(me|us)\b/gi, 'you')
  .replace(/\b(i|we)\b/gi, 'you');

// which family a phrase means (first match wins: cling film before foil, foil before containers).
// Each pattern also knows the Arabic words a visitor on /ar would use (no \b there: it only sees Latin letters).
const FAMILY_WORDS: [string, RegExp][] = [
  ['cling-film', /cling|stretch\s*film|food\s*wrap|سلوفان|نايلون|كلينج|كلنج|تغليف الطعام|غلاف/i],
  ['cutlery', /cutlery|spoon|fork|knife|knives|ملاعق|ملعقة|شوك|شوكة|سكاكين|سكين|أدوات المائدة|ادوات المائدة/i],
  ['microwave', /micro|plastic|black|clear|tub|مايكرويف|ميكروويف|مايكروويف|بلاستيك|اسود|أسود|شفاف/i],
  ['platters', /platter|serving|party|صواني التقديم|صينية تقديم|أطباق التقديم|اطباق تقديم|بلاتر|حفلات|حفلة/i],
  ['cups-trays', /\bcups?\b|\btrays?\b|ramekin|cupcake|muffin|أكواب|اكواب|كوب|صواني|صينية|كب كيك|مافن/i],
  ['pots', /\bpots?\b|قدور|قدر|طناجر|طنجرة/i],
  ['foil', /\bfoil\b|\brolls?\b|ورق ألمنيوم|ورق الألمنيوم|ورق المنيوم|فويل|رول|لفة|لفائف/i],
  ['containers', /contain|take\s*-?\s*away|\blids?\b|alumin|\bbox|علب|علبة|حاويات|حاوية|سفري|أغطية|غطاء|ألمنيوم|المنيوم|ألومنيوم/i],
];
const YES = /^(yes|yeah|yep|yup|sure|ok(ay)?|please|go ahead|do it|alright|sounds good|of course|definitely|why not)\b|^(نعم|ايوه|أيوه|إيه|اي|أكيد|اكيد|تمام|طيب|حسنا|حسناً|موافق|يلا|يالله|بالتأكيد|من فضلك|لو سمحت)/i;
const NO = /^(no|nope|not now|not yet|later|nah|no thanks)\b|^(لا(\s|$|،|\.)|ليس الآن|مو الحين|مش الحين|لاحقا|لاحقاً|بعدين)/i;
const QUOTE = /quote|price|pricing|cost|how much|rate|order|buy|bulk|wholesale|عرض سعر|عرض أسعار|سعر|أسعار|اسعار|بكم|كم السعر|تكلفة|طلب|أطلب|اطلب|شراء|أشتري|اشتري|جملة/i;
const FACTORY = /factory|how .*made|manufactur|process|production|machine|\bline\b|مصنع|المصنع|كيف تصنع|كيف يصنع|تصنيع|إنتاج|انتاج|خط الإنتاج|آلات|مكائن|مكينة/i;
const THANKS = /\b(thank|thanks|cheers|shukran)\b|شكرا|شكراً|مشكور|يعطيك العافية/i;
const BYE = /\b(bye|goodbye|see you|that'?s all|that is all)\b|مع السلامة|باي|وداعا|وداعاً|هذا كل شيء/i;
const HELLO = /^(hi|hello|hey|salam|assalam|marhaba|good (morning|afternoon|evening))\b|^(مرحبا|مرحباً|السلام عليكم|سلام|أهلا|اهلا|هلا|صباح الخير|مساء الخير)/i;
const WHO = /who are you|your name|are you (a |an )?(bot|robot|ai|human|real)|من أنت|من انت|ما اسمك|شو اسمك|هل أنت روبوت|هل انت روبوت|إنسان|انسان/i;
const WHERE = /where are you|location|address|located|visit|directions|أين|اين|وين|موقع|عنوان|زيارة|أزوركم|ازوركم|الطريق/i;
const HOURS = /\bhours\b|opening|timing|what time|when are you open|ساعات|الدوام|دوام|متى تفتح|متى تفتحون|أوقات|اوقات/i;
const PHONE = /phone|call you|number|whats\s*app|هاتف|تلفون|رقم الهاتف|رقمكم|رقم التواصل|اتصال|أتصل|اتصل|واتساب|واتس/i;
const EMAIL = /e-?mail|بريد|ايميل|إيميل/i;
const CUSTOM = /custom|print|logo|brand|مخصص|خاص|طباعة|طبع|شعار|لوجو|علامة تجارية|براند/i;
const NUMBER = /(\d[\d,.]*)\s*(k\b|thousand|ألف|الف|آلاف|الاف)?/i;
const CITY = /(dubai|abu dhabi|sharjah|ajman|ras al khaimah|\brak\b|fujairah|umm al quwain|al ain|oman|muscat|saudi|riyadh|jeddah|qatar|doha|kuwait|bahrain|uae|دبي|أبوظبي|ابوظبي|أبو ظبي|ابو ظبي|الشارقة|شارقة|عجمان|رأس الخيمة|راس الخيمة|الفجيرة|أم القيوين|ام القيوين|العين|عمان|عُمان|مسقط|السعودية|الرياض|جدة|قطر|الدوحة|الكويت|البحرين|الإمارات|الامارات)/i;
// one product, asked for by its number: "I want product 8325", "show me the 83185", "code 83 25"
// (speech often splits the digits, so they're joined back up)
const PRODUCT = /\b(?:product|item|code|model|ref(?:erence)?|number)\s*#?\s*(\d[\d\s]{2,8}\d)|\b(?:want|show|open|see)\s+(?:me\s+)?(?:the\s+)?(\d[\d\s]{2,8}\d)\b|(?:المنتج|منتج|رقم|كود|موديل|أريد|اريد|أبي|ابي|أبغى|ابغى|اعرض|اعرضي|افتح|افتحي|شوف|أرني|ارني)\s*#?\s*(\d[\d\s]{2,8}\d)/i;
const productIn = (text) => {
  const m = text.match(PRODUCT);
  const ref = m && (m[1] || m[2] || m[3]).replace(/\s+/g, '');
  return ref && ref.length >= 4 && ref.length <= 6 ? ref : null;
};

type Memo = { need: string | null; use: string | null; qty: string | null; city: string | null; stage: string | null };

export function createBrain({ families }: { families: FamilyInfo[] }) {
  const fam = (id) => families.find((f) => f.id === id);
  let saved: { history?: Turn[]; memo?: Memo } = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { /* fresh */ }
  const history = saved.history || [];                                   // [{ role, content }]
  const memo = saved.memo || { need: null, use: null, qty: null, city: null, stage: null };
  const persist = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ history: history.slice(-24), memo })); } catch { /* private mode */ } };

  let remote = null; // null = not checked, true = the AI endpoint is configured
  const checkRemote = async () => {
    if (remote !== null) return remote;
    try { remote = !!(await (await fetch('/api/assistant')).json()).ready; } catch { remote = false; }
    return remote;
  };

  const familyIn = (text) => {
    const hit = FAMILY_WORDS.find(([, re]) => re.test(text));
    return hit && fam(hit[0]) ? fam(hit[0]) : null;
  };
  const quoteFill = () => ({
    family: memo.need || '',
    quantity: memo.qty || '',
    city: memo.city || '',
    notes: [memo.need && fam(memo.need)?.name, memo.use && tc('for {use}', { use: memo.use })].filter(Boolean).join(' ') || '',
  });

  // ── the scripted salesperson ──
  function local(text) {
    // Arabic-Indic digits (٨٣٢٥) read as 8325
    const t = text.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    const f = familyIn(t);

    if (WHO.test(t)) return { say: tc('I’m Arifa, the Arifa Pack assistant. I can show you our range, open products for you and start a quote. What are you looking for?') };
    if (THANKS.test(t) && !f) return { say: tc(pick(['You’re very welcome! Anything else I can show you?', 'My pleasure. Is there anything else you need?'])) };
    if (BYE.test(t)) return { say: tc('Thanks for stopping by Arifa Pack. Our team is here Monday to Saturday whenever you’re ready.') };
    if (WHERE.test(t)) return { say: tc('We’re in Al Jurf Industrial Area 2, in Ajman. Would you like me to start a quote while you’re here?') };
    if (HOURS.test(t)) return { say: tc('We’re open Monday to Saturday, from 8 in the morning to 8 at night, Ajman time.') };
    if (PHONE.test(t)) return { say: tc('You can call us on plus 971, 6, 747, 7061. Or I can start a quote for you right now.') };
    if (EMAIL.test(t)) return { say: tc('Our email is info at arifapack dot com. The quote form here writes the email for you, if that helps.') };
    if (CUSTOM.test(t)) return { say: tc('Yes, custom packaging design and branding are available on request. Tell me the product and quantity and I’ll put it on your quote.') };
    const ref = productIn(t);
    if (ref) return { say: tc(pick(['The {ref}? Let me open it for you.', 'Sure, product {ref}. Opening it now.']), { ref }), action: { type: 'product', ref } };
    if (FACTORY.test(t)) return { say: tc('Let me show you our line. Every container is formed on our Japanese-made presses.'), action: { type: 'factory' } };

    if (QUOTE.test(t) || (memo.stage === 'offer' && YES.test(t))) {
      if (f) memo.need = f.id;
      memo.stage = 'quoted';
      return {
        say: tc(pick(['Of course. Prices depend on size and quantity, so I’ll start a quote with what you’ve told me.', 'Happy to. Let me open the quote form and fill in what we’ve talked about.'])),
        action: { type: 'quote', fill: quoteFill() },
      };
    }
    if (f) {
      memo.need = f.id;
      memo.stage = 'use';
      return {
        say: tc(pick([
          '{name}, good choice. We have {count} in the range. Let me bring them up for you.',
          'Sure, {lname}. There are {count} to choose from, let me show you.',
        ]), { name: f.name, lname: f.name.toLowerCase(), count: f.count }),
        action: { type: 'family', id: f.id },
      };
    }
    if (memo.stage === 'offer' && NO.test(t)) {
      memo.stage = null;
      return { say: tc('No problem at all. Take your time, and just ask if you want me to show you anything.') };
    }
    // qualifying, one question at a time
    if (memo.stage === 'use' && t.split(/\s+/).length >= 1 && !HELLO.test(t)) {
      memo.use = t.replace(/^(i('| a)m |we('| a)re |it'?s |for |i want to |we want to )+/i, '').replace(/[.!?]+$/, '');
      memo.stage = 'qty';
      const said = reflect(memo.use);
      return { say: tc(pick(['Got it, {said}. Roughly how many cartons would you need?', 'Lovely, {said}. And about how many cartons are you thinking?']), { said }) };
    }
    if (memo.stage === 'qty' && NUMBER.test(t)) {
      const m = t.match(NUMBER);
      memo.qty = `${m[1]}${m[2] ? tc(' thousand') : ''}`;
      memo.stage = 'city';
      return { say: tc('Around {qty} cartons, noted. Which city should we deliver to?', { qty: memo.qty }) };
    }
    if (memo.stage === 'city') {
      const c = t.match(CITY);
      memo.city = c ? c[1].replace(/\b\w/g, (x) => x.toUpperCase()) : t.replace(/[.!?]+$/, '');
      memo.stage = 'offer';
      return { say: tc('Perfect, {city}. Shall I put all of this into a quote request for you?', { city: memo.city }) };
    }
    if (HELLO.test(t)) return { say: tc('Hello! What are you looking for today: containers, foil, platters, or something else?') };
    return {
      say: tc(pick([
        'Sorry, I didn’t quite catch that. Are you looking for aluminium containers, foil, platters, pots, microwave tubs or cutlery?',
        'I can help with containers, foil, platters, pots, cups, microwave ware, cutlery and cling film. Which one are you after?',
      ])),
    };
  }

  const describe = (a) => (a?.type === 'family' ? `showed ${fam(a.id)?.name}`
    : a?.type === 'product' ? `opened product ${a.ref}`
      : a?.type === 'quote' ? 'opened the quote form'
        : a?.type === 'factory' ? 'showed the production line' : '');

  return {
    memo,
    // what the page says after an action lands (scripted mode keeps qualifying);
    // `which`: ask which one they'd like to see instead (the opening's visitor names one next)
    arrived(id, { which = false } = {}) {
      const f = fam(id);
      const lead = tc('Here they are, all {count} {lname}.', { count: f.count, lname: f.name.toLowerCase() });
      const say = which ? `${lead} ${tc('Which one would you like to see?')}`
        : memo.use ? lead : `${lead} ${tc('What will you be packing in them?')}`;
      if (!memo.use && !which) memo.stage = 'use';
      history.push({ role: 'assistant', content: say });
      persist();
      return say;
    },
    // a line said outside reply() (the opening's scripted visitor, her description of a product)
    note(role, content) {
      history.push({ role, content });
      persist();
    },
    async reply(text, page) {
      history.push({ role: 'user', content: text });
      let out = null;
      if (await checkRemote()) {
        try {
          const r = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ messages: history.slice(-20), page, lang: isArPage() ? 'ar' : 'en' }),
          });
          if (r.ok) out = await r.json();
          else if (r.status === 401 || r.status === 501) remote = false;
        } catch { /* offline: fall through to the script */ }
        if (out?.action?.type === 'family') { memo.need = out.action.id; }
      }
      if (!out || (!out.say && !out.action)) out = local(text);
      if (!out.say) out.say = tc('Let me do that for you.');
      history.push({ role: 'assistant', content: `${out.say}${out.action ? ` (${describe(out.action)})` : ''}` });
      persist();
      return out;
    },
    usingAI: () => remote === true,
    checkRemote,
  };
}
