import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import type { FamilyInfo, PageName, QuoteFill } from './types';
import { env } from '@/lib/env';
import { createBrain } from '@/assistant/brain';
import { currentSession, sendContact, ApiError, apiEnabled, type EventOut, type SiteAction } from '@/lib/arifaApi';
import { enquiry } from '@/lib/enquiry';
import { initNudges } from '@/assistant/nudges';
import { askedFor, extractContact, type ContactFields, type Expecting } from '@/assistant/contactCapture';
import type { LiveVoice } from '@/assistant/liveVoice';
import { isArPage, lhc, tc } from '@/i18n/client';

/*
  Arifa: the site's assistant panel, run entirely by the Arifa backend (src/lib/arifaApi.ts,
  WEBSITE_API.md). There is no built-in or scripted assistant: every answer comes from the backend.

    Type a message (the text box), tap a suggestion, or tap the mic for a live voice call (LiveKit).
    The backend answers with a reply and site actions: show a family, open a product, go to a page,
    scroll to a section, the factory, add to the enquiry list, fill in the enquiry desk, or ask for
    contact details (the contact card). The page carries each action out with its own moves: her
    pointer, the filters, the quick view, the enquiry desk.

  Without the backend (NEXT_PUBLIC_ARIFA_API_URL empty, or not reachable), she says she isn't
  available and offers WhatsApp click-to-chat.
*/

const KEY = 'arifa-assist';
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') || {}; } catch { return {}; } };
const save = (s) => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ } };
const wait = (s) => new Promise<void>((r) => { gsap.delayedCall(s, r); });
const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

// shortcuts under the greeting: each is sent to the backend as if typed
const SUGGEST = [
  { label: tc('Aluminium containers'), q: tc('aluminium containers') },
  { label: tc('Microwave tubs'), q: tc('microwave containers') },
  { label: tc('Foil rolls'), q: tc('aluminium foil') },
  { label: tc('Get a quote'), q: tc('I need a quote') },
];
const GREETING = tc('Hi, welcome to Arifa Pack! What are you looking for today?');
const VOICE_LABEL: Record<string, string> = Object.fromEntries(Object.entries({
  off: 'Type below, or tap the mic and talk',
  connecting: 'Connecting…',
  listening: 'Listening… go ahead',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  unavailable: 'Voice isn’t available right now. You can type instead.',
}).map(([k, v]) => [k, tc(v)]));

export type HeroAssist = {
  labelFor(id: string): HTMLElement | null;
  bringToFront(id: string): Promise<void>;
  hold(on: boolean): void;
  pulse?(): void;
  hubRect?(): DOMRect;
  faceHub?(): Promise<void>;
  setHub?(on: boolean): void;
};

export function initAssistant({ page, lenis, hero: heroIn = null }: { page: PageName; lenis?: Lenis; hero?: HeroAssist | null }) {
  const card = document.querySelector<HTMLElement>('[data-assist]');
  if (!card) return { handoff(_id: string) {}, async start(_o: { quiet?: boolean } = {}) {}, async opening(_h?: HeroAssist | null) {}, async arrive() {} };
  let hero = heroIn; // (home: the hero's ring, handed over by opening())
  const greeting = card.dataset.greeting || GREETING; // (the CMS's greeting, site.assistant, when it has one)
  const log = card.querySelector<HTMLElement>('[data-assist-log]');
  const statusEl = card.querySelector<HTMLElement>('[data-assist-status]');
  const chipsEl = card.querySelector<HTMLElement>('[data-assist-chips]');
  const voiceEl = card.querySelector<HTMLElement>('[data-assist-voice]');
  const mic = card.querySelector<HTMLElement>('[data-assist-mic]');
  const dock = document.querySelector<HTMLElement>('[data-assist-dock]');
  const leafBox = dock.querySelector<HTMLElement>('[data-assist-leaf]');
  const pointer = document.querySelector<HTMLElement>('[data-assist-cursor]');
  let families: FamilyInfo[] = [];
  try { families = JSON.parse(document.getElementById('family-data').textContent); } catch { /* none */ }
  const fam = (id) => families.find((f) => f.id === id);
  const brain = createBrain();

  // ── the leaf, cut from the nav's own logo (leaves only) ──
  const navSvg = document.querySelector<SVGSVGElement>('[data-nav-logo] .logo-svg');
  if (navSvg) {
    const b = navSvg.querySelector<SVGGraphicsElement>('.logo-leaves').getBBox();
    const make = (id: string) => {
      const svg = navSvg.cloneNode(true) as SVGSVGElement;
      svg.querySelector('.logo-word')?.remove();
      svg.querySelector('linearGradient').id = id;
      svg.querySelector('.logo-leaves').setAttribute('fill', `url(#${id})`);
      svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`);
      svg.removeAttribute('class');
      return svg;
    };
    leafBox.appendChild(make('arifa-leaf-dock'));
    card.querySelector<HTMLElement>('[data-assist-badge]').appendChild(make('arifa-leaf-badge'));
  }

  const state = load();
  let busy = false;
  let queued: { text: string; input: 'text' | 'voice' } | null = null;
  let flying = false;

  // ── the conversation on screen ──
  // Once the visitor has used her (typed, tapped a suggestion, opened her, started a call), the card
  // stays open from page to page, with the last lines of the conversation, until they press ✕.
  // (state.open and state.log live in sessionStorage: this tab only, gone when it closes)
  const remember = (who: 'you' | 'bot' | 'wa', text: string) => {
    if (!text) return;
    state.log = [...(state.log || []), { who, text }].slice(-5);
    save(state);
  };
  const keepOpen = (on: boolean) => {
    if (!!state.open === on) return;
    state.open = on;
    save(state);
  };
  const trim = () => { while (log.children.length > 5) log.firstElementChild.remove(); };
  const bubble = (who, text) => {
    const li = document.createElement('li');
    li.className = `assist__msg assist__msg--${who}`;
    li.textContent = text;
    log.appendChild(li);
    trim();
    if (who === 'you') { keepOpen(true); remember('you', text); } else remember('bot', text);
    gsap.from(li, { opacity: 0, y: 8, duration: 0.4, ease: 'expo.out' });
    log.scrollTop = log.scrollHeight;
    return li;
  };
  let liveLi = null; // what the visitor is saying, as they say it
  const live = (text) => {
    if (!liveLi) { liveLi = bubble('you', text); liveLi.classList.add('is-live'); }
    else liveLi.textContent = text;
  };
  const heard = (text) => {
    if (liveLi) { liveLi.textContent = text; liveLi.classList.remove('is-live'); liveLi = null; }
    else bubble('you', text);
  };


  // live voice: a LiveKit call with the backend's voice agent (src/assistant/liveVoice.ts)
  let liveVoice: LiveVoice | null = null;
  const setVoiceState = (s) => {
    card.dataset.voice = s;
    if (liveVoice) card.classList.remove('is-invite');
    mic.setAttribute('aria-pressed', String(!!liveVoice));
    mic.setAttribute('aria-label', tc(liveVoice ? 'End the voice call' : 'Talk to Arifa'));
    voiceEl.textContent = VOICE_LABEL[s] || '';
  };

  // a line as captions: every word there but dim, lit one by one at the pace it's said
  const pace = (text) => (env.reduced ? 0.01 : Math.min(5.5, Math.max(1.2, text.length / 14.5)));
  const caption = (li, text, duration) => {
    li.textContent = '';
    const spans = text.split(' ').map((word, i, all) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = i < all.length - 1 ? `${word} ` : word;
      li.appendChild(w);
      return w;
    });
    let lit = 0;
    const o = { n: 0 };
    const tween = gsap.to(o, {
      n: spans.length, duration, ease: 'none',
      onUpdate: () => {
        const k = Math.min(spans.length, Math.ceil(o.n));
        while (lit < k) { spans[lit - 1]?.classList.remove('now'); spans[lit].classList.add('on', 'now'); lit++; }
      },
    });
    const finish = () => { tween.kill(); spans.forEach((w) => { w.classList.add('on'); w.classList.remove('now'); }); };
    return { tween, finish };
  };

  // Arifa's line (the backend's reply): it lights up word by word as captions
  const say = async (text) => {
    const li = document.createElement('li');
    li.className = 'assist__msg assist__msg--bot';
    li.innerHTML = '<span class="assist__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    log.appendChild(li);
    trim();
    gsap.from(li, { opacity: 0, y: 8, duration: 0.4, ease: 'expo.out' });
    await wait(env.reduced ? 0 : 0.35);
    const cap = caption(li, text, pace(text));
    remember('bot', text);
    noteAsk(text);
    log.scrollTop = log.scrollHeight;
    await cap.tween;
    cap.finish();
    log.scrollTop = log.scrollHeight;
  };
  // what she's doing: a task (`busy`), or an invitation (`invite`)
  const status = (text, kind = 'busy') => {
    statusEl.dataset.kind = kind;
    statusEl.innerHTML = text ? `<i aria-hidden="true"></i><span>${text}</span>` : '';
  };
  const chips = (list) => {
    chipsEl.innerHTML = '';
    list.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'assist__chip';
      b.textContent = c.label;
      b.addEventListener('click', () => { bubble('you', c.label); handle(c.q); });
      chipsEl.appendChild(b);
    });
    if (list.length) gsap.from(chipsEl.children, { opacity: 0, y: 6, duration: 0.5, stagger: 0.05, ease: 'expo.out' });
  };

  // ── where the card sits: beside the hero's leaves, or docked above the leaf on the right ──
  const placeBesideHub = () => {
    if (env.small) { Object.assign(card.style, { left: '16px', top: 'auto', bottom: '16px' }); return; }
    const r = hero.hubRect();
    const w = card.offsetWidth || 340;
    Object.assign(card.style, { left: `${Math.min(r.right + 28, innerWidth - w - 24)}px`, top: `${Math.max(90, r.top + r.height * 0.05)}px`, bottom: '' });
  };
  const openCard = (docked) => {
    if (!hero?.hubRect) docked = true;
    card.hidden = false;
    card.classList.toggle('is-docked', docked);
    if (docked) Object.assign(card.style, { left: '', top: '', bottom: '' });
    else placeBesideHub();
  };
  const isDocked = () => !dock.hidden;

  // the leaf leaves the centre of the hero and docks bottom-right; the card follows it
  async function flyToDock() {
    if (isDocked()) return;
    const before = card.getBoundingClientRect();
    flying = true;
    if (hero?.faceHub && hero.hubRect && hero.setHub && !env.reduced) {
      await hero.faceHub();
      const from = hero.hubRect();
      dock.hidden = false;
      const to = leafBox.getBoundingClientRect();
      hero.setHub(false);
      gsap.fromTo(leafBox, {
        x: from.left + from.width / 2 - (to.left + to.width / 2),
        y: from.top + from.height / 2 - (to.top + to.height / 2),
        scale: from.height / to.height,
      }, { x: 0, y: 0, scale: 1, duration: 1.15, ease: 'expo.inOut' });
    } else {
      dock.hidden = false;
      hero?.setHub?.(false);
    }
    openCard(true);
    const after = card.getBoundingClientRect();
    if (!env.reduced) gsap.fromTo(card, { x: before.left - after.left, y: before.top - after.top }, { x: 0, y: 0, duration: 1.1, ease: 'expo.inOut', clearProps: 'transform' });
    state.docked = true;
    save(state);
    await wait(env.reduced ? 0 : 1.15);
    flying = false;
  }

  // ── her pointer ──
  const pos = { x: innerWidth - 60, y: innerHeight - 80 };
  const setPointer = () => gsap.set(pointer, { x: pos.x, y: pos.y });
  const showPointer = () => {
    if (+getComputedStyle(pointer).opacity > 0.5) return;
    [pos.x, pos.y] = isDocked() ? centre(leafBox) : [innerWidth / 2, innerHeight / 2];
    setPointer();
    gsap.to(pointer, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' });
  };
  const hidePointer = () => gsap.to(pointer, { opacity: 0, scale: 0.6, duration: 0.3 });
  // glide along a gentle arc; the target is re-read every frame so it can still be moving
  const moveTo = (target, dur = 1.1) => {
    const sx = pos.x, sy = pos.y;
    const o = { t: 0 };
    return gsap.to(o, {
      t: 1, duration: env.reduced ? 0.01 : dur, ease: 'power2.inOut',
      onUpdate: () => {
        const [ex, ey] = target();
        const mx = (sx + ex) / 2 - (ey - sy) * 0.22, my = (sy + ey) / 2 + (ex - sx) * 0.22;
        const t = o.t, u = 1 - t;
        pos.x = u * u * sx + 2 * u * t * mx + t * t * ex;
        pos.y = u * u * sy + 2 * u * t * my + t * t * ey;
        setPointer();
      },
    });
  };
  const press = async (el, act = () => el.click()) => {
    el.classList.add('is-assist-target');
    const ring = document.createElement('span');
    ring.className = 'assist-ripple';
    document.body.appendChild(ring);
    gsap.set(ring, { x: pos.x, y: pos.y });
    gsap.fromTo(ring, { scale: 0.3, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ring.remove() });
    await gsap.fromTo(pointer, { scale: 1 }, { scale: 0.82, duration: 0.12, yoyo: true, repeat: 1 });
    await wait(0.15);
    el.classList.remove('is-assist-target');
    act();
  };
  // type into a real form field, a character at a time
  const typeInto = async (field, text) => {
    if (!field || !text) return;
    await moveTo(() => centre(field), 0.8);
    await press(field, () => field.focus({ preventScroll: true }));
    field.value = '';
    for (const ch of text) {
      field.value += ch;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(env.reduced ? 0 : 0.03);
    }
  };

  // `quiet`: asked by the backend, which speaks for itself: just show the family (no line of our own,
  // no product opened on top)
  async function showFamily(f, { quiet = false } = {}) {
    if (page !== 'home' && page !== 'products') {
      state.pending = { kind: 'family', id: f.id, quiet };
      save(state);
      window.location.href = lhc(`/products?family=${f.id}`);
      return;
    }
    if (page === 'home') {
      await flyToDock();
      status(tc('Finding {name}…', { name: f.name }));
      showPointer();
      state.pending = { kind: 'family', id: f.id, quiet };
      save(state);
      const label = hero?.labelFor(f.id);
      if (label) {
        // turn the ring until that family is at the front, and click it
        hero.hold(true);
        const link = label.querySelector('a');
        await Promise.all([hero.bringToFront(f.id), moveTo(() => centre(link), 1.5)]);
        await wait(0.2);
        status(tc('Opening the catalogue…'));
        await press(link);
      } else {
        const nav = [...document.querySelectorAll<HTMLAnchorElement>('.nav__links a')].find((a) => a.getAttribute('href') === lhc('/products'));
        const go = () => (window.location.href = lhc(`/products?family=${f.id}`));
        if (visible(nav)) { await moveTo(() => centre(nav), 1.2); status(tc('Opening the catalogue…')); await press(nav, go); } else go();
      }
      return;
    }
    // products page: close any open product, click the family chip, then open one
    showPointer();
    const qvClose = document.querySelector<HTMLElement>('.qv.is-open .qv__close');
    if (qvClose) {
      status(tc('Closing this one…'));
      await moveTo(() => centre(qvClose), 0.9);
      await press(qvClose);
      await wait(0.8);
    }
    status(tc('Filtering to {name}…', { name: f.name }));
    await scrollToGrid();
    const chip = document.querySelector<HTMLElement>(`.cat-chip[data-family="${f.id}"]`);
    if (chip && !chip.classList.contains('is-active')) {
      await moveTo(() => centre(chip), 1.1);
      await press(chip);
      await wait(1.1);
    }
    if (quiet) { hidePointer(); status(''); return; }
    await openFirst(f);
  }

  const scrollToGrid = async () => {
    const grid = document.getElementById('catalogue');
    if (!grid) return;
    const top = grid.getBoundingClientRect().top + window.scrollY - 10;
    if (Math.abs(window.scrollY - top) > 40) {
      lenis?.scrollTo(top, { duration: 1.1 });
      await wait(1.2);
    }
  };

  // open a product card with her pointer: bring it on screen and click it
  async function openProductCard(pc, label = tc('Opening one for you…')) {
    const r = pc.getBoundingClientRect();
    if (r.top < 120 || r.bottom > innerHeight - 40) {
      lenis?.scrollTo(pc, { offset: -innerHeight * 0.28, duration: 1 });
      await wait(1.1);
    }
    status(label);
    await moveTo(() => centre(pc.querySelector('.pcard__media') || pc), 1.1);
    await press(pc.querySelector('.pcard__hit'));
    hidePointer();
    status('');
  }

  async function openFirst(f) {
    const card0 = document.querySelector<HTMLElement>(`.pcard[data-family="${f.id}"]:not(.is-hidden)`);
    if (!card0) { hidePointer(); status(''); return; }
    await openProductCard(card0);
  }

  // a product on the catalogue by its number ("8325", "83185"): an exact match first, and one
  // that is showing before one the filters have hidden
  const productCard = (ref) => {
    const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const want = norm(ref);
    const refOf = (pc) => { const r = pc.querySelector('.pcard__ref span'); return norm(r?.dataset.raw || r?.textContent); };
    const all = [...document.querySelectorAll<HTMLElement>('.pcard')];
    let hits = all.filter((pc) => refOf(pc) === want);
    if (!hits.length) hits = all.filter((pc) => refOf(pc).startsWith(`${want} `));
    return hits.find((pc) => !pc.classList.contains('is-hidden')) || hits[0] || null;
  };

  // products page: open one product by its number, then say what it is (and offer the quote)
  async function openProduct(ref, { card = null as HTMLElement | null } = {}) {
    const pc = card || productCard(ref);
    if (!pc) { console.warn('[Arifa] product not on this page:', ref); return; }
    showPointer();
    const qvClose = document.querySelector<HTMLElement>('.qv.is-open .qv__close');
    if (qvClose) {
      status(tc('Closing this one…'));
      await moveTo(() => centre(qvClose), 0.9);
      await press(qvClose);
      await wait(0.8);
    }
    // hidden by a search or by the other range (trade / self range): clear those first, so the grid
    // behind the product shows its own family (not "No match")
    const search = document.querySelector<HTMLInputElement>('[data-cat-search]');
    const otherRange = (pc.dataset.range === 'self') !== (document.querySelector('[data-cat-self]')?.getAttribute('aria-pressed') === 'true');
    if (pc.classList.contains('is-hidden') && (search?.value || otherRange)) {
      await scrollToGrid();
      document.dispatchEvent(new CustomEvent('arifa:catalogue-show', { detail: { family: pc.dataset.family, self: pc.dataset.range === 'self' } }));
      await wait(1.1);
    }
    // filtered out by another family: switch the filter to its own
    if (pc.classList.contains('is-hidden')) {
      await scrollToGrid();
      const chip = document.querySelector<HTMLElement>(`.cat-chip[data-family="${pc.dataset.family}"]`);
      if (chip) { status(tc('Filtering to {name}…', { name: fam(pc.dataset.family)?.name || tc('its range') })); await moveTo(() => centre(chip), 1.1); await press(chip); await wait(1.1); }
    }
    await openProductCard(pc, tc('Opening {ref}…', { ref }));
  }

  // anywhere: one product by its number. On the home page that means the catalogue, searched to
  // that number, where the next page opens it (arrive())
  // (`id`: one product exactly, as the backend names it)
  async function showProduct(ref, { id = null as string | null } = {}) {
    if (page === 'products') {
      const card = id ? document.querySelector<HTMLElement>(`.pcard[data-product="${CSS.escape(id)}"]`) : null;
      await openProduct(ref, { card });
      return;
    }
    await flyToDock();
    state.pending = { kind: 'product', ref, id };
    save(state);
    // (the catalogue as it is: no search left in the box, so the grid behind the product isn't "No match")
    const go = () => (window.location.href = lhc('/products'));
    const nav = [...document.querySelectorAll<HTMLAnchorElement>('.nav__links a')].find((a) => a.getAttribute('href') === lhc('/products'));
    showPointer();
    status(tc('Opening the catalogue…'));
    if (visible(nav) && nav.getBoundingClientRect().top >= 0) { await moveTo(() => centre(nav), 1.2); await press(nav, go); } else go();
  }

  async function fillQuote(fill: QuoteFill = {}) {
    // contact page: the enquiry desk takes what we know, and moves on to "who's asking"
    if (page === 'contact') {
      document.dispatchEvent(new CustomEvent('arifa:quote-fill', { detail: fill }));
      await wait(1.2);
      state.pending = null;
      save(state);
      return;
    }
    const formQ = document.querySelector<HTMLFormElement>('[data-quote]');
    if (!formQ) return;
    lenis?.scrollTo('#contact', { offset: -20, duration: 1.4 });
    await wait(1.5);
    showPointer();
    status(tc('Filling in your quote…'));
    const f = fam(fill.family);
    if (f) {
      const box = formQ.querySelector<HTMLInputElement>(`input[name="family"][value="${f.name}"]`);
      if (box && !box.checked) { await moveTo(() => centre(box.closest<HTMLLabelElement>('label') || box), 0.9); await press(box); }
    }
    const field = (name: string) => formQ.elements.namedItem(name) as HTMLInputElement;
    await typeInto(field('detail'), fill.notes || (f ? f.name : ''));
    await typeInto(field('quantity'), fill.quantity);
    await typeInto(field('city'), fill.city);
    const nameField = field('name');
    await moveTo(() => centre(nameField), 0.9);
    nameField.focus({ preventScroll: true });
    hidePointer();
    status('');
    state.pending = null;
    save(state);
  }

  async function goQuote(fill) {
    if (page === 'contact') {
      await fillQuote(fill);
      return;
    }
    // any other page: carry what we know to the enquiry desk on the contact page
    state.pending = { kind: 'quote', fill };
    save(state);
    showPointer();
    status(tc('Opening the enquiry desk…'));
    const btn = document.querySelector<HTMLElement>('.nav__right .btn');
    if (visible(btn)) { await moveTo(() => centre(btn), 1.2); await press(btn); } else window.location.href = lhc('/contact');
  }

  // the factory tour: "Walk the floor" (#floor, the film's seven stops; #factory is the press), opened
  // at the chapter the backend names (tour_chapters keys, in the order of the stops on the page)
  const CHAPTERS = ['arrival', 'forming', 'lids', 'foil', 'packing', 'moulding', 'warehouse'];
  async function goFactory(chapter?: string | null) {
    if (page !== 'home') {
      state.pending = { kind: 'factory', chapter: chapter || null };
      save(state);
      window.location.href = lhc('/#floor');
      return;
    }
    await flyToDock();
    const root = document.getElementById('floor');
    if (!root) return;
    const stops = [...root.querySelectorAll<HTMLElement>('.chapter')];
    const i = Math.max(0, CHAPTERS.indexOf(String(chapter || '')));
    // big screens: the section is pinned and the scroll walks the track sideways, so the stop is a point
    // along the pin; phones: the stops are stacked, so it is the stop itself
    const pinned = ScrollTrigger.getAll().find((t) => t.trigger === root && t.pin);
    const to = pinned ? pinned.start + (pinned.end - pinned.start) * (stops.length > 1 ? i / (stops.length - 1) : 0) : i > 0 && stops[i] ? stops[i] : root;
    if (lenis) lenis.scrollTo(to as number | HTMLElement, { duration: 1.6 });
    else if (typeof to === 'number') window.scrollTo({ top: to, behavior: 'smooth' });
    else to.scrollIntoView({ behavior: 'smooth' });
    await wait(1.7);
  }


  // ── one turn: the visitor's words go to the backend; its reply is shown and its actions done ──
  async function handle(text: string, input: 'text' | 'voice' = 'text') {
    text = text.trim();
    if (!text) return;
    if (busy) { queued = { text, input }; return; }
    busy = true;
    const picked = pickContact(text); // (sent after the message: see the end of this turn)
    chips([]);
    setVoiceState(liveVoice ? 'listening' : 'thinking');
    try {
      // the actions arrive while the reply is still being written: what stays on this page runs at
      // once (the page moves straight away); what leaves it waits until the reply has been shown
      const later: SiteAction[] = [];
      const out = await brain.reply(text, { input, onAction: (a) => (leavesPage(a) ? later.push(a) : enqueue(a)) });
      sendPicked(picked); // the message has reached the backend: now the details it held go to /contact
      showSource();
      await say(out.say);
      if (out.whatsapp) whatsapp(out.whatsapp);
      await queue;
      later.forEach(enqueue);
      await queue;
    } finally {
      release();
    }
  }
  // the backend can't answer: WhatsApp click-to-chat is the way through (WEBSITE_API.md §4)
  function whatsapp(href: string) {
    const li = document.createElement('li');
    li.className = 'assist__msg assist__msg--bot';
    const a = document.createElement('a');
    a.className = 'assist__wa';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = tc('Chat on WhatsApp');
    li.appendChild(a);
    log.appendChild(li);
    trim();
    remember('wa', href);
    log.scrollTop = log.scrollHeight;
  }

  // ── the backend's site actions (WEBSITE_API.md §2a): what to show, never how ──
  // Each one is done with the page's own moves (the pointer, the filters, the quick view). They run
  // one after another; a visitor who scrolls or clicks takes over and the rest are dropped.
  const doneActions = new Set<string>(); // (an action id is done once, even if it arrives twice)
  let queue: Promise<void> = Promise.resolve();
  let queueGen = 0;
  function enqueue(a: SiteAction) {
    if (!a?.type) return;
    if (a.id) { if (doneActions.has(a.id)) return; doneActions.add(a.id); }
    const gen = queueGen;
    queue = queue.then(() => (gen === queueGen ? runAction(a) : undefined)).catch((e) => console.warn('[Arifa] action failed:', a.type, e));
  }
  function backendActions(list: SiteAction[] = []) { list.forEach(enqueue); }
  const stopQueue = (e: Event) => { if (!card.contains(e.target as Node) && !(e.target as Element)?.closest?.('.assist-dock')) queueGen++; };
  ['wheel', 'touchmove', 'pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, stopQueue, { passive: true, capture: true }));

  // where an action lands, in this page's language (the chat's language doesn't matter)
  const landing = (a: SiteAction) => {
    const r = a.resolved;
    const p = r ? (isArPage() ? r.path_ar : r.path_en) : null;
    return p ? (r.anchor && !p.includes('#') ? `${p}#${r.anchor}` : p) : null;
  };
  const samePage = (path: string) => {
    const u = new URL(path, location.href);
    return u.pathname.replace(/\/+$/, '') === location.pathname.replace(/\/+$/, '');
  };
  const pathOfPage = (name: string, section?: string | null) =>
    lhc(name === 'home' ? '/' : `/${name}`) + (section ? `#${section}` : '');
  // (does it take the visitor to another page? then it waits for the reply to be said)
  function leavesPage(a: SiteAction) {
    switch (a.type) {
      case 'show_family': return page !== 'products' && page !== 'home';
      case 'show_product': return a.view === 'page' || page !== 'products';
      case 'navigate': return !samePage(landing(a) || pathOfPage(a.page, a.section));
      case 'factory_tour': return page !== 'home';
      case 'fill_enquiry': return page !== 'contact';
      default: return false;
    }
  }
  async function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    lenis?.scrollTo(el, { offset: -70, duration: 1.4 });
    await wait(1.5);
  }
  // the enquiry list takes products by id (the catalogue's own details when this page has them)
  function addToEnquiry(ids: string[] = []) {
    let products: any[] = [];
    try { products = JSON.parse(document.getElementById('catalogue-data')?.textContent || '{}').products || []; } catch { /* none */ }
    ids.forEach((id) => {
      const p = products.find((x) => x.id === id);
      enquiry.add(p ? { id, ref: p.ref, name: p.name, code: p.code, img: p.img, familyName: p.familyName } : { id, ref: id, name: '', code: '', img: null, familyName: '' });
    });
  }
  async function runAction(a: SiteAction) {
    console.info('[Arifa] action:', a.type, a);
    switch (a.type) {
      case 'show_family': {
        const f = fam(a.family);
        if (f) await showFamily(f, { quiet: true });
        else if (landing(a)) window.location.href = landing(a);
        break;
      }
      case 'show_product': {
        if (a.view === 'page') { window.location.href = landing(a) || lhc(`/products/${a.product_id}`); break; }
        await showProduct(a.product_id, { id: a.product_id });
        break;
      }
      case 'navigate': {
        const to = landing(a) || pathOfPage(a.page, a.section);
        if (samePage(to)) { const id = a.section || new URL(to, location.href).hash.slice(1); if (id) await scrollToSection(id); }
        else window.location.href = to;
        break;
      }
      case 'scroll_to': await scrollToSection(a.section); break;
      case 'factory_tour': await goFactory(a.chapter); break;
      case 'add_to_enquiry': addToEnquiry(a.product_ids); break;
      case 'fill_enquiry': {
        const f = a.fill || {};
        const families: string[] = Array.isArray(f.family) ? f.family : f.family ? [f.family] : [];
        await goQuote({ ...f, family: families[0], families, notes: f.message || f.detail } as QuoteFill);
        break;
      }
      // the assistant asks in her own words; the visitor's answer is picked up by captureContact()
      case 'ask_contact': expecting = Object.fromEntries((a.fields?.length ? a.fields : ['name', 'phone', 'email']).map((f: string) => [f, true])); break;
    }
  }

  // the contact card in the chat: name, phone, email and two separate, unticked consents
  // (POST /v1/public/sessions/{id}/contact). The words next to the ticks go with it as proof.
  // ── contact details from the conversation (no form): what the visitor types or says that is a name,
  // a phone, an email or a company goes to POST /sessions/{id}/contact (src/assistant/contactCapture.ts).
  // Each detail is sent once; the opt-ins stay false (consent is never assumed from chat) ──
  let expecting: Expecting = {};
  // her line asks for something ("May I have your name and number?"): the next answer is read with that in mind
  function noteAsk(line: string) {
    const asked = askedFor(line || '');
    (Object.keys(asked) as (keyof Expecting)[]).forEach((k) => { if (asked[k]) expecting[k] = true; });
  }
  // read what the visitor said now (while her last question still counts) …
  function pickContact(text: string): ContactFields {
    const found = extractContact(text, expecting);
    expecting = {};
    return found;
  }
  // … and send it once the message itself has gone to the backend (messages first, then contact)
  function captureContact(text: string) { sendPicked(pickContact(text)); }
  function sendPicked(found: ContactFields) {
    const known = (state.contact || {}) as ContactFields;
    const fresh = (Object.keys(found) as (keyof ContactFields)[]).filter((k) => found[k] && found[k] !== known[k]);
    if (!fresh.length || !apiEnabled()) return;
    const all = { ...known, ...found };
    state.contact = all;
    save(state);
    sendContact({ ...all, whatsapp_opt_in: false, email_opt_in: false }).catch((e) =>
      console.warn('[Arifa] contact details not saved:', e instanceof ApiError ? `${e.status} ${e.reason || ''}` : e));
  }

  // a short message from the assistant after a visitor event (src/assistant/nudges.ts)
  async function nudge(out: EventOut) {
    if (busy) return; // (never over a turn in progress)
    if (card.hidden) { openCard(true); if (!isDocked()) { dock.hidden = false; state.docked = true; save(state); } }
    if (out.reply) await say(out.reply);
    backendActions(out.actions);
  }
  initNudges({ show: nudge });
  // during a call, the agent hears where the visitor is when they open or close a product
  ['arifa:product-open', 'arifa:product-close'].forEach((ev) => document.addEventListener(ev, () => liveVoice?.sendContext()));

  function release() {
    busy = false;
    setVoiceState(liveVoice ? 'listening' : 'off');
    if (queued) { const q = queued; queued = null; handle(q.text, q.input); }
  }

  // ── voice: a live call with the backend's voice agent. The mic tap is the visitor's consent to talk
  // (the backend's "Enter the factory"); the agent plays the recording notice itself ──
  const shown = (text) => {
    const li = bubble('bot', '');
    const cap = caption(li, text, pace(text));
    remember('bot', text);
    noteAsk(text);
    cap.tween.then(() => cap.finish());
  };
  async function toggleVoice() {
    if (liveVoice) { const v = liveVoice; liveVoice = null; await v.stop(); setVoiceState('off'); return; }
    keepOpen(true);
    if (!apiEnabled() || currentSession()?.voice_available === false) { setVoiceState('unavailable'); return; }
    setVoiceState('connecting');
    try {
      brain.setVoiceConsent(true);
      const { startLiveVoice } = await import('@/assistant/liveVoice');
      liveVoice = await startLiveVoice(isArPage() ? 'ar' : 'en', {
        onState: (st) => { if (st === 'off') { liveVoice = null; setVoiceState('off'); } else setVoiceState(st); },
        onLine: (text, me) => { if (me) { bubble('you', text); captureContact(text); } else shown(text); },
        onLevel: (v) => { const x = v.toFixed(3); card.style.setProperty('--lvl', x); dock.style.setProperty('--lvl', x); },
        onAction: (a) => enqueue(a), // (the agent's site actions during the call)
      });
      tag.textContent = tc('Live AI');
    } catch (e) {
      console.warn('[Arifa] live voice unavailable:', e instanceof ApiError ? `${e.status} ${e.reason || ''}` : e);
      liveVoice = null;
      setVoiceState('unavailable');
    }
  }
  mic.addEventListener('click', () => { toggleVoice(); });

  // the text box: what's typed is a turn. During a call it goes into the call (kx.chat.in), so voice
  // and text stay one conversation
  const typeForm = card.querySelector<HTMLFormElement>('[data-assist-type]');
  typeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = typeForm.querySelector<HTMLInputElement>('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    bubble('you', text);
    if (liveVoice) { liveVoice.sendText(text); captureContact(text); return; }
    handle(text, 'text');
  });

  card.querySelector<HTMLElement>('[data-assist-close]').addEventListener('click', () => {
    keepOpen(false); // (only ✕ closes her for good: the next page starts with her docked)
    gsap.to(card, { opacity: 0, y: 12, duration: 0.3, ease: 'power2.in', onComplete: () => { card.hidden = true; gsap.set(card, { clearProps: 'opacity,transform' }); } });
    if (!isDocked()) { dock.hidden = false; state.docked = true; save(state); gsap.from(leafBox, { scale: 0, duration: 0.6, ease: 'back.out(2)' }); }
  });
  dock.addEventListener('click', () => {
    if (!card.hidden) { card.hidden = true; keepOpen(false); return; }
    keepOpen(true);
    openCard(true);
    gsap.from(card, { opacity: 0, y: 14, duration: 0.45, ease: 'expo.out' });
    if (!log.children.length) { bubble('bot', greeting); chips(SUGGEST); }
    card.querySelector<HTMLInputElement>('[data-assist-type] input')?.focus({ preventScroll: true });
  });
  // the greeting card belongs to the hero: it steps aside once you scroll on
  window.addEventListener('scroll', () => {
    if (!card.hidden && !card.classList.contains('is-docked')) card.classList.toggle('is-away', window.scrollY > innerHeight * 0.35);
  }, { passive: true });
  window.addEventListener('resize', () => { if (!card.hidden && !card.classList.contains('is-docked') && hero) placeBesideHub(); });

  setVoiceState('off');
  if (state.docked) dock.hidden = false;

  // a refresh (the visitor reloaded this page) starts her afresh: closed, no conversation on screen, as on a
  // first visit. Moving to another page is not a refresh: she stays open with the conversation (below).
  // (the backend conversation itself carries on, so a refresh doesn't use up one of the visitor's sessions)
  const navType = (performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined)?.type;
  if (navType === 'reload') {
    Object.assign(state, { open: false, log: [], pending: null, docked: false, contact: state.contact });
    save(state);
  }

  // a new page, and the visitor was talking to her: she is still open, with the conversation so far
  if (state.open) {
    dock.hidden = false;
    state.docked = true;
    (state.log || []).forEach((m: { who: 'you' | 'bot' | 'wa'; text: string }) => {
      const li = document.createElement('li');
      li.className = `assist__msg assist__msg--${m.who === 'you' ? 'you' : 'bot'}`;
      if (m.who === 'wa') {
        const a = document.createElement('a');
        Object.assign(a, { className: 'assist__wa', href: m.text, target: '_blank', rel: 'noopener', textContent: tc('Chat on WhatsApp') });
        li.appendChild(a);
      } else if (m.who === 'bot') {
        // (already said: shown lit, not captioned again)
        m.text.split(' ').forEach((word, i, all) => {
          const w = document.createElement('span');
          w.className = 'w on';
          w.textContent = i < all.length - 1 ? `${word} ` : word;
          li.appendChild(w);
        });
      } else li.textContent = m.text;
      log.appendChild(li);
    });
    openCard(true);
    log.scrollTop = log.scrollHeight;
  }
  // the header tag: "Live AI" once the backend has answered, "Offline" when it can't be reached
  const tag = card.querySelector<HTMLElement>('.assist__name .mono');
  function showSource() { tag.textContent = tc(brain.online() ? 'Live AI' : 'Offline'); }
  tag.textContent = tc(apiEnabled() ? 'Live AI' : 'Offline');

  return {
    // (kept for the pages' start scripts)
    handoff(familyId) {
      state.pending = { kind: 'family', id: familyId, quiet: true };
      state.docked = true;
      save(state);
    },
    // any page: the leaf waits in its dock
    async start({ quiet = false } = {}) {
      dock.hidden = false;
      if (quiet || state.docked) return;
    },
    // home, once the hero has formed: the leaf docks, and the card says hello (no conversation of
    // its own: the first word is the visitor's)
    async opening(heroApi) {
      if (heroApi) hero = heroApi;
      if (state.pending) return; // (arrive() is carrying on from another page)
      if (dock.hidden) { dock.hidden = false; if (!env.reduced) gsap.from(leafBox, { scale: 0, duration: 0.7, ease: 'back.out(2)' }); }
      if (state.docked || (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward') return;
      await wait(0.5);
      log.replaceChildren();
      openCard(true);
      card.classList.add('is-invite');
      gsap.from(card, { opacity: 0, y: 14, duration: 0.6, ease: 'expo.out' });
      bubble('bot', greeting);
      chips(SUGGEST);
      state.docked = true;
      save(state);
    },
    // any page: carry on what an action on the last page started (a family, a product, the enquiry desk)
    async arrive() {
      const p = state.pending;
      if (!p) return;
      dock.hidden = false;
      busy = true;
      try {
        if (p.kind === 'family' && page === 'products' && fam(p.id)) {
          // (the filter is on from the address; nothing more to do)
        } else if (p.kind === 'product' && page === 'products') {
          const pc = p.id ? document.querySelector<HTMLElement>(`.pcard[data-product="${CSS.escape(p.id)}"]`) : null;
          await openProduct(p.ref, { card: pc });
        } else if (p.kind === 'factory' && page === 'home') {
          await wait(0.6);
          await goFactory(p.chapter);
        } else if (p.kind === 'quote' && page === 'contact') {
          await fillQuote(p.fill);
        }
      } finally {
        state.pending = null;
        save(state);
        release();
      }
    },
  };
}
