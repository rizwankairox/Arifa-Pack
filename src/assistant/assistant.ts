import gsap from 'gsap';
import type Lenis from 'lenis';
import type { AssistantAction, FamilyInfo, PageName, QuoteFill } from './types';
import { env } from '@/lib/env';
import { createVoice } from '@/assistant/voice';
import { createBrain, backendAvailable } from '@/assistant/brain';
import { currentSession, sendContact, ApiError, type EventOut, type SiteAction } from '@/lib/arifaApi';
import { enquiry } from '@/lib/enquiry';
import { initNudges } from '@/assistant/nudges';
import type { LiveVoice } from '@/assistant/liveVoice';
import { isArPage, lhc, tc } from '@/i18n/client';

/*
  Arifa — the site's voice sales assistant.

  Talk to her (voice only: the mic stays open once you allow it), or tap one of her
  suggestions. She answers out loud and
  then does things on the page with her own pointer: turns the hero ring to a
  family and opens it, filters the catalogue, opens a product, or fills in the quote
  form while you watch. What she says comes from brain.js — Claude when the dev
  server has an API key, a scripted salesperson otherwise.

  Home: once the hero has formed, the leaf (docked bottom right) opens a first
  conversation, played like a real one — she greets you, a visitor answers ("I'm
  looking for aluminium containers"), she first walks them down through the line to
  show how one is made (press, form, lid), then takes them on to the collection with
  her pointer (opening(), below). The conversation carries across pages.
*/

const KEY = 'arifa-assist';
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') || {}; } catch { return {}; } };
const save = (s) => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ } };
const wait = (s) => new Promise<void>((r) => { gsap.delayedCall(s, r); });
const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

const SUGGEST = [
  { label: tc('Aluminium containers'), q: tc('aluminium containers') },
  { label: tc('Microwave tubs'), q: tc('microwave containers') },
  { label: tc('Foil rolls'), q: tc('aluminium foil') },
  { label: tc('Get a quote'), q: tc('I need a quote') },
];
const GREETING = tc('Hi, welcome to Arifa Pack! What are you looking for today?');

// the home page's opening conversation (opening(), below)
const OPENING = [
  { who: 'arifa', text: tc('Hi there, welcome to Arifa Pack. I’m Arifa. What can I help you find today?') },
  { who: 'you', text: tc('I’m looking for aluminium containers.'), family: 'containers' },
  { who: 'arifa', text: tc('Lovely choice, those are our speciality. Before I take you to them, let me show you how we make one.'), tour: true, go: 'containers' },
];
// …the tour: down through the line (src/sections/home/line.ts), whose one shot of the press is scrubbed by
// scroll from 0 to 1 (src/three/scenes/PressScene.ts, its timeline ÷ 10). She stops where each step has played
// out: the punch has struck by 0.30, the formed container is out of the die by 0.56, and by 0.84 its
// embossed lid has closed and the light has crossed it — just before the shot melts into the range
const TOUR = [
  { at: 0.3, text: tc('Every container starts on our Japanese-made presses. The punch cuts a blank from the aluminium strip and draws it into the die, in one precise stroke.') },
  { at: 0.56, text: tc('That precision is what gives the best finish. The spare metal folds into neat corner pleats, and the rim is curled smooth and strong, piece after piece, at high output.') },
  { at: 0.84, text: tc('Then the embossed lid closes over the rim. Japanese engineering, consistent quality, made here in the UAE.') },
];
const TOUR_END = tc('That’s how every one is made. Now let me show you the whole collection.');
// …and on the collection's page the visitor carries on, asking for one product by its number
const OPENING_PICK = { ref: '8325', text: tc('I want product 8325.') };
const canTalk = typeof window !== 'undefined' && 'speechSynthesis' in window;
// the visitor's side is read by a second voice: the most natural other English voice installed
const MALE = /guy|ryan|davis|brian|andrew|christopher|eric|steffan|david|mark|george|william|thomas|liam|hamdan|hamed|shakir|taim|bassel|omar|moaz|rami|male/i;
const rankVoice = (v) => (/natural|neural/i.test(v.name) ? 40 : 0) + (/online/i.test(v.name) ? 12 : 0) + (/google/i.test(v.name) ? 10 : 0) + (v.localService ? 0 : 1);
function visitorVoice() {
  const en = canTalk ? speechSynthesis.getVoices().filter((v) => (isArPage() ? /^ar[-_]/i : /^en[-_]/i).test(v.lang)).sort((a, b) => rankVoice(b) - rankVoice(a)) : [];
  return en.find((v) => MALE.test(v.name)) || en[1] || en[0] || null;
}
const VOICE_LABEL: Record<string, string> = Object.fromEntries(Object.entries({
  off: 'Tap the mic and just talk to me',
  listening: 'Listening… go ahead',
  thinking: 'Thinking…',
  speaking: 'Speaking… tap the mic to interrupt',
  blocked: 'Tap anywhere and I’ll keep talking',
  // help, written out in full (shown in sentence case, see .assist[data-voice] in main.css)
  denied: 'Your browser has blocked the microphone for this site. Click the crossed-out mic at the left of the address bar, choose “Always allow”, and I’ll start listening straight away.',
  system: 'Windows is blocking the microphone. Open Settings → Privacy & security → Microphone, turn on “Let desktop apps access your microphone”, then tap the mic again.',
  nomic: 'Your computer isn’t offering any microphone right now. Headphones without a mic, or a Bluetooth headset that isn’t connected, won’t show up. Connect one and I’ll notice straight away.',
  busy: 'Your microphone is connected but won’t start. Another app (Teams, Zoom, Discord, WhatsApp) may be holding it: close that app, then tap the mic again.',
  found: 'Microphone connected. Tap the mic and start talking.',
  unsupported: 'Voice needs Chrome or Edge, opened at localhost or https.',
  offline: 'I can’t reach the speech service right now. Please try again in a moment.',
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


export function initAssistant({ page, lenis, hero = null }: { page: PageName; lenis?: Lenis; hero?: HeroAssist | null }) {
  const card = document.querySelector<HTMLElement>('[data-assist]');
  if (!card) return { handoff(_id: string) {}, async start(_o: { quiet?: boolean } = {}) {}, async opening(_h?: HeroAssist | null) {}, async arrive() {} };
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
  const brain = createBrain({ families });

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
  let opening = null; // the opening conversation, while it plays: { over }
  const endOpening = () => {
    if (!opening || opening.over) return;
    opening.over = true;
    if (canTalk) speechSynthesis.cancel();
    status('');
  };
  let busy = false;
  let queued = null;
  let flying = false;
  let blockedLine = null;

  // ── the conversation on screen ──
  const trim = () => { while (log.children.length > 5) log.firstElementChild.remove(); };
  const bubble = (who, text) => {
    const li = document.createElement('li');
    li.className = `assist__msg assist__msg--${who}`;
    li.textContent = text;
    log.appendChild(li);
    trim();
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

  // the leaf that's on screen gives a little lift on each spoken word
  let lastPulse = 0;
  const pulseLeaf = () => {
    const now = performance.now();
    if (now - lastPulse < 180 || flying) return;
    lastPulse = now;
    if (dock.hidden && hero) hero.pulse();
    else gsap.fromTo(leafBox, { scale: 1 }, { scale: 1.07, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out', overwrite: 'auto' });
  };

  // live voice through the Arifa backend (LiveKit), when the site is connected to it (src/assistant/liveVoice.ts)
  let liveVoice: LiveVoice | null = null;
  const micOn = () => voice?.on || !!liveVoice;
  const setVoiceState = (s) => {
    card.dataset.voice = s;
    if (micOn()) card.classList.remove('is-invite');
    mic.setAttribute('aria-pressed', String(micOn()));
    mic.setAttribute('aria-label', tc(micOn() ? 'Turn the microphone off' : 'Talk to Arifa'));
    voiceEl.textContent = VOICE_LABEL[s] || '';
  };
  const voice = createVoice({
    onInterim: (t) => { if (!voice.speaking) live(t); },
    onFinal: (t) => { heard(t); handle(t, 'voice'); },
    onState: (s) => setVoiceState(busy && s === 'listening' ? 'thinking' : s),
    onWord: pulseLeaf,
    onLevel: (v) => { const x = v.toFixed(3); card.style.setProperty('--lvl', x); dock.style.setProperty('--lvl', x); },
  });

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

  // Arifa speaks: the line lights up word by word while the voice reads it
  const say = async (text) => {
    const li = document.createElement('li');
    li.className = 'assist__msg assist__msg--bot';
    li.innerHTML = '<span class="assist__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    log.appendChild(li);
    trim();
    gsap.from(li, { opacity: 0, y: 8, duration: 0.4, ease: 'expo.out' });
    if (!voice.on) hero?.pulse();
    await wait(env.reduced ? 0 : 0.35);
    const cap = caption(li, text, pace(text));
    log.scrollTop = log.scrollHeight;
    // (out loud when the mic is on — or when the home page's opening conversation handed over to here)
    if (voice.on || state.aloud) {
      const heardIt = await voice.speak(text);
      if (!heardIt) { blockedLine = text; setVoiceState('blocked'); }
    }
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
    if (!hero) docked = true;
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
    if (hero && !env.reduced) {
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
      hero?.setHub(false);
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

  // the visitor's side of the opening: their words appear as they say them, in a second voice
  function visitorSays(text) {
    const li = bubble('you', '');
    li.classList.add('is-live');
    const est = text.length / 14 + 0.35;
    const cap = caption(li, text, env.reduced ? 0.01 : est * 0.92);
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => { if (settled) return; settled = true; cap.finish(); li.classList.remove('is-live'); resolve(); };
      const started = performance.now();
      const v = visitorVoice();
      if (!canTalk || !v) { setTimeout(done, est * 1000); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.lang = v.lang; u.rate = 1.04; u.pitch = 0.96;
      // (an "end" far sooner than the line could be said means it wasn't heard: keep the captions' pace)
      u.onend = () => setTimeout(done, Math.max(0, started + est * 700 - performance.now()));
      u.onerror = () => setTimeout(done, Math.max(0, started + est * 1000 - performance.now()));
      speechSynthesis.speak(u);
      setTimeout(done, est * 1000 + 6000);
    });
  }

  // the opening's last step: her pointer leaves the leaf, the stage forms that family, she clicks
  // its tab, and the collection opens (where she carries on: arrive())
  async function takeThere(id, heroApi, off) {
    const f = fam(id);
    const label = heroApi?.labelFor(id) || document.querySelector<HTMLElement>(`[data-hero] [data-family="${id}"]`);
    const link = label?.querySelector('a');
    if (!f || !link) return;
    if (window.scrollY > innerHeight * 0.3) { lenis?.scrollTo(0, { duration: 1.1 }); await wait(1.15); }
    status(`Finding ${f.name}…`);
    showPointer();
    await Promise.all([heroApi?.bringToFront(id), moveTo(() => centre(link), 1.5)]);
    if (off()) { hidePointer(); status(''); heroApi?.hold(false); return; }
    await wait(0.25);
    status(tc('Opening the collection…'));
    state.pending = { kind: 'family', id, pick: OPENING_PICK };
    state.docked = true;
    save(state);
    await press(link);
  }

  // a long, even glide of the page (the visitor's own wheel or swipe takes over from it at once)
  const glide = (top: number, duration: number) => new Promise<void>((resolve) => {
    if (!lenis) { window.scrollTo(0, top); resolve(); return; }
    lenis.scrollTo(top, {
      duration, immediate: env.reduced, onComplete: () => resolve(),
      easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    });
    setTimeout(resolve, (env.reduced ? 0 : duration * 1000) + 400); // (taken over: it never completes)
  });

  // The opening's tour, before she takes them to a family: down into the line, stopping at each
  // step of the shot while she says what it does (TOUR), then on through the melt into the range
  // below, where she clicks that family's row and the collection opens (arrive() carries on there).
  // Any scroll, swipe or scrolling key of the visitor's own ends it where it is. False if cut short.
  async function tourLine(id, heroApi, off) {
    const line = document.querySelector<HTMLElement>('[data-line]');
    const row = document.querySelector<HTMLAnchorElement>(`[data-range-list] a[href$="family=${id}"]`);
    if (!line || !row || !fam(id)) return false;
    const lineY = (p) => line.getBoundingClientRect().top + window.scrollY + p * (line.offsetHeight - innerHeight);
    // (measured again on arrival: a resize or late content above can move the target mid-glide)
    const glideTo = async (y, duration) => {
      await glide(y(), duration);
      if (!off() && Math.abs(window.scrollY - y()) > 24) await glide(y(), 0.6);
    };
    const quit = () => endOpening();
    const keys = (e: Event) => { if (!(e instanceof KeyboardEvent)) return; if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key)) quit(); };
    const watch: [string, (e: Event) => void][] = [['wheel', quit], ['touchmove', quit], ['keydown', keys]];
    watch.forEach(([e, f]) => window.addEventListener(e, f, { passive: true }));
    try {
      heroApi?.hold(false); // (the stage may turn again behind us)
      status(tc('Showing you how it’s made…'));
      await glideTo(() => lineY(0), 2.4);
      for (const stop of TOUR) {
        if (off()) return false;
        await Promise.all([say(stop.text), glideTo(() => lineY(stop.at), 4.2)]);
        if (off()) return false;
        await wait(0.5);
      }
      // the shot melts into the range; the family's row comes up a third of the way down the screen
      if (off()) return false;
      status('');
      const rowY = () => row.getBoundingClientRect().top + window.scrollY - innerHeight * 0.32;
      await Promise.all([say(TOUR_END), glideTo(rowY, 3.2)]);
      if (off()) return false;
      await wait(0.5); // (the rows rise in as they arrive: src/sections/home/range.ts)
      status(`Opening ${fam(id).name}…`);
      showPointer();
      await moveTo(() => centre(row.querySelector<HTMLElement>('.range__name') || row), 1.4);
      if (off()) { hidePointer(); return false; }
      state.pending = { kind: 'family', id, pick: OPENING_PICK };
      state.docked = true;
      save(state);
      await press(row);
      return true;
    } finally {
      watch.forEach(([e, f]) => window.removeEventListener(e, f));
      if (off()) { status(''); hidePointer(); }
    }
  }

  // ── what she does ──
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
  async function openProduct(ref, { narrate = true, card = null as HTMLElement | null } = {}) {
    const pc = card || productCard(ref);
    if (!pc) { await say(tc('I can’t find a product numbered {ref}. Could you tell me the number again?', { ref })); return; }
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
    if (!narrate) return;
    // what it is, from the card itself: its name, and how many to a carton
    const name = pc.querySelector<HTMLElement>('.pcard__name')?.textContent.trim().replace(/&/g, 'and') || 'product';
    const pack = [...pc.querySelectorAll<HTMLElement>('.pcard__spec div')].find((d) => /pack|تعبئة/i.test(d.querySelector<HTMLElement>('dt')?.textContent || ''))?.querySelector<HTMLElement>('dd')?.textContent || '';
    const pcs = pack.match(/(\d[\d,]*)\s*(?:pcs|قطعة)/i)?.[1];
    const line = tc('This is the {ref}, our {name}{packed}. Would you like a quote for it?', {
      ref, name: name.toLowerCase(), packed: pcs ? tc(', packed {pcs} to a carton', { pcs: pcs.replace(/,/g, '') }) : '',
    });
    brain.memo.need = pc.dataset.family;
    brain.memo.stage = 'offer'; // ("yes" starts the quote: brain.js)
    brain.note('assistant', line);
    await wait(0.9);
    await say(line);
  }

  // anywhere: one product by its number. On the home page that means the catalogue, searched to
  // that number, where the next page opens it (arrive())
  // (`id`: one product exactly, as the backend names it; `narrate`: say what it is afterwards)
  async function showProduct(ref, { id = null as string | null, narrate = true } = {}) {
    if (page === 'products') {
      const card = id ? document.querySelector<HTMLElement>(`.pcard[data-product="${CSS.escape(id)}"]`) : null;
      await openProduct(ref, { narrate, card });
      return;
    }
    await flyToDock();
    state.pending = { kind: 'product', ref, id, narrate };
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
      await say(tc('I’ve started your enquiry with what you told me. Add your name and how we should reply, then seal and send it.'));
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
    await say(tc('I’ve filled in what you told me. Just add your name and email, then press send, and our team will reply with prices.'));
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

  async function goFactory() {
    if (page !== 'home') { window.location.href = lhc('/#factory'); return; }
    await flyToDock();
    showPointer();
    const link = [...document.querySelectorAll<HTMLAnchorElement>('.nav__links a')].find((a) => a.getAttribute('href') === lhc('/#factory'));
    if (visible(link)) { await moveTo(() => centre(link), 1.2); await press(link); } else lenis?.scrollTo('#factory', { duration: 1.6 });
    await wait(1.2);
    hidePointer();
  }

  async function act(action: AssistantAction | null) {
    if (action?.type === 'family' && fam(action.id)) await showFamily(fam(action.id));
    else if (action?.type === 'product' && action.ref) await showProduct(String(action.ref));
    else if (action?.type === 'quote') await goQuote(action.fill || {});
    else if (action?.type === 'factory') await goFactory();
    else if (action?.type === 'whatsapp') {
      // the backend is unavailable: WhatsApp click-to-chat is the way through
      const li = document.createElement('li');
      li.className = 'assist__msg assist__msg--bot';
      const a = document.createElement('a');
      a.className = 'assist__wa';
      a.href = action.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = tc('Chat on WhatsApp');
      li.appendChild(a);
      log.appendChild(li);
      trim();
      log.scrollTop = log.scrollHeight;
    }
  }

  // what the page is showing, so the AI knows where the visitor is
  const where = () => {
    if (page === 'home') return 'home page';
    if (page === 'contact') return 'contact page, at the enquiry desk';
    if (page === 'notfound') return 'a page that does not exist (404); help them find the right page';
    if (page !== 'products') return `${page} page`;
    const chip = document.querySelector<HTMLElement>('.cat-chip.is-active');
    const open = document.querySelector<HTMLElement>('.qv.is-open h2')?.textContent;
    return `products page${chip && chip.dataset.family !== 'all' ? `, filtered to ${fam(chip.dataset.family)?.name}` : ''}${open ? `, product ${open} open` : ''}`;
  };

  // one turn: think, answer out loud, then act
  async function handle(text, input: 'text' | 'voice' = 'text') {
    text = text.trim();
    if (!text) return;
    endOpening(); // (the visitor has taken over from the scripted opening)
    if (busy) { queued = text; return; }
    busy = true;
    chips([]);
    if (voice.on) setVoiceState('thinking');
    try {
      // the backend's site actions arrive while the reply is still being written: what stays on this
      // page runs at once (the page moves straight away); what leaves it waits until she has spoken
      const later: SiteAction[] = [];
      const out = await brain.reply(text, where(), { input, onAction: (a) => (leavesPage(a) ? later.push(a) : enqueue(a)) });
      showSource();
      await say(out.say);
      if (out.action) await act(out.action);
      await queue;
      later.forEach(enqueue);
      await queue;
    } finally {
      release();
    }
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
        await showProduct(a.product_id, { id: a.product_id, narrate: false });
        break;
      }
      case 'navigate': {
        const to = landing(a) || pathOfPage(a.page, a.section);
        if (samePage(to)) { const id = a.section || new URL(to, location.href).hash.slice(1); if (id) await scrollToSection(id); }
        else window.location.href = to;
        break;
      }
      case 'scroll_to': await scrollToSection(a.section); break;
      case 'factory_tour': await goFactory(); break;
      case 'add_to_enquiry': addToEnquiry(a.product_ids); break;
      case 'fill_enquiry': {
        const f = a.fill || {};
        const families: string[] = Array.isArray(f.family) ? f.family : f.family ? [f.family] : [];
        await goQuote({ ...f, family: families[0], families, notes: f.message || f.detail } as QuoteFill);
        break;
      }
      case 'ask_contact': contactCard(a.fields, a.consents); break;
    }
  }

  // the contact card in the chat: name, phone, email and two separate, unticked consents
  // (POST /v1/public/sessions/{id}/contact). The words next to the ticks go with it as proof.
  function contactCard(fields: string[] = [], consents: string[] = []) {
    const want = fields.length ? fields : ['name', 'phone', 'email'];
    const ticks = consents.length ? consents : ['whatsapp', 'email'];
    const words = {
      whatsapp: tc('Send my quotation on WhatsApp'),
      email: tc('Send my quotation by email'),
    };
    const labels = { name: tc('Your name'), company: tc('Company'), phone: tc('Phone / WhatsApp'), email: tc('Email') };
    const types = { name: 'text', company: 'text', phone: 'tel', email: 'email' };
    const auto = { name: 'name', company: 'organization', phone: 'tel', email: 'email' };
    const li = document.createElement('li');
    li.className = 'assist__msg assist__msg--bot assist__card-msg';
    const form = document.createElement('form');
    form.className = 'assist__contact';
    form.noValidate = true;
    form.innerHTML = `
      ${want.filter((f) => labels[f]).map((f) => `<label class="assist__cfield"><span>${labels[f]}</span><input name="${f}" type="${types[f]}" autocomplete="${auto[f]}" /></label>`).join('')}
      ${ticks.filter((c) => words[c]).map((c) => `<label class="assist__ctick"><input type="checkbox" name="opt_${c}" /><span>${words[c]}</span></label>`).join('')}
      <div class="assist__crow"><button type="submit" class="assist__csend">${tc('Send')}</button><span class="assist__cmsg" role="status" aria-live="polite"></span></div>`;
    li.appendChild(form);
    log.appendChild(li);
    trim();
    log.scrollTop = log.scrollHeight;
    const msg = form.querySelector<HTMLElement>('.assist__cmsg');
    const v = (n) => (form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value || '').trim();
    const on = (n) => !!form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.checked;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!v('phone') && !v('email')) { msg.textContent = tc('Add a phone number or an email.'); return; }
      const ticked = ticks.filter((c) => on(`opt_${c}`));
      const btn = form.querySelector<HTMLButtonElement>('button');
      btn.disabled = true;
      try {
        await sendContact({
          name: v('name'), company: v('company'), phone: v('phone'), email: v('email'),
          whatsapp_opt_in: on('opt_whatsapp'), email_opt_in: on('opt_email'),
          consent_wording: ticked.map((c) => words[c]).join(' / ') || undefined,
        });
        li.textContent = tc('Thank you. We have your details.');
      } catch (err) {
        btn.disabled = false;
        msg.textContent = err instanceof ApiError && err.status === 422
          ? tc('That phone number or email doesn’t look right.')
          : tc('Couldn’t send that just now. Please try again.');
      }
    });
    form.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  }

  // a short message from the assistant after a visitor event (src/assistant/nudges.ts)
  async function nudge(out: EventOut) {
    if (busy || (opening && !opening.over)) return; // (never over a conversation in progress)
    if (card.hidden) { openCard(true); if (!isDocked()) { dock.hidden = false; state.docked = true; save(state); } }
    if (out.reply) await say(out.reply);
    backendActions(out.actions);
  }
  initNudges({ show: nudge });
  // during a call, the agent hears where the visitor is when they open or close a product
  ['arifa:product-open', 'arifa:product-close'].forEach((ev) => document.addEventListener(ev, () => liveVoice?.sendContext()));

  // done acting: listen again, and answer anything said in the meantime
  function release() {
    busy = false;
    if (voice.on && !voice.speaking) setVoiceState('listening');
    if (queued) { const q = queued; queued = null; handle(q); }
  }

  // ── controls ──
  // `prompt: false` — resume only if the mic is already allowed (never ask without a tap)
  async function enableVoice({ greet = false, prompt = true } = {}) {
    const ok = await voice.start({ prompt });
    state.voice = ok;
    save(state);
    if (ok && greet && !state.greeted) {
      state.greeted = true;
      save(state);
      await say(tc('I’m listening. Just tell me what you need.'));
    }
    return ok;
  }
  // the agent's lines arrive as captions (its voice comes from the room, not from speak())
  const shown = (text) => {
    const li = bubble('bot', '');
    const cap = caption(li, text, pace(text));
    cap.tween.then(() => cap.finish());
  };
  // live voice: the mic tap is the visitor's consent to talk (the backend's "Enter the factory").
  // Returns false when live voice isn't on offer (no backend, a text-only language, or it failed),
  // and the browser's own speech takes over, still answered by the backend.
  async function toggleLiveVoice() {
    if (!backendAvailable()) return false; // (no backend, or not reachable just now: the browser's speech)
    if (liveVoice) { const v = liveVoice; liveVoice = null; await v.stop(); setVoiceState('off'); return true; }
    if (currentSession()?.voice_available === false) return false;
    setVoiceState('thinking');
    try {
      const { startLiveVoice } = await import('@/assistant/liveVoice');
      liveVoice = await startLiveVoice(isArPage() ? 'ar' : 'en', {
        onState: (st) => { if (st === 'off') { liveVoice = null; setVoiceState('off'); } else setVoiceState(st); },
        onLine: (text, me) => { endOpening(); if (me) heard(text); else shown(text); },
        onLevel: (v) => { const x = v.toFixed(3); card.style.setProperty('--lvl', x); dock.style.setProperty('--lvl', x); },
        onAction: (a) => enqueue(a), // (the agent's site actions during the call)
      });
      return true;
    } catch (e) {
      console.warn('Live voice unavailable, using the browser’s speech.', e);
      liveVoice = null;
      setVoiceState('off');
      return false;
    }
  }
  // the text box: what's typed is a turn like what's said. During a live voice call it goes into
  // the call instead (kx.chat.in), so voice and text stay one conversation.
  const typeForm = card.querySelector<HTMLFormElement>('[data-assist-type]');
  typeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = typeForm.querySelector<HTMLInputElement>('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    endOpening();
    bubble('you', text);
    if (liveVoice) { liveVoice.sendText(text); return; }
    handle(text, 'text');
  });

  mic.addEventListener('click', async () => {
    if (liveVoice) { await toggleLiveVoice(); state.voice = false; state.wantsVoice = false; save(state); return; }
    if (backendAvailable() && !voice.on && !voice.speaking) {
      brain.setVoiceConsent(true);
      if (await toggleLiveVoice()) return;
    }
    if (voice.speaking) { voice.hush(); return; }       // interrupt her
    if (voice.on) { voice.stop(); state.voice = false; state.wantsVoice = false; save(state); return; }
    state.wantsVoice = true;                            // remembered: if the mic is blocked, start once it's allowed
    save(state);
    enableVoice({ greet: true });
  });
  // allowed from the address bar (or Windows settings) while the page is open: start listening, no reload
  voice.watchPermission((perm) => {
    if (perm === 'granted' && state.wantsVoice && !voice.on) enableVoice({ greet: true, prompt: false });
    else if (perm === 'denied' && state.wantsVoice) setVoiceState('denied');
  });
  // a mic plugged in or a headset connected while the page is open: pick it up without a reload.
  // Already allowed → start listening; not yet allowed → invite a tap (never ask on our own).
  voice.watchDevices(async (mics) => {
    if (voice.on || !state.wantsVoice) return;
    if (mics === 0) { setVoiceState('nomic'); return; }
    const perm = await voice.permission();
    if (perm === 'granted') enableVoice({ greet: true, prompt: false });
    else setVoiceState(perm === 'denied' ? 'denied' : 'found');
  });
  card.querySelector<HTMLElement>('[data-assist-close]').addEventListener('click', () => {
    endOpening();
    gsap.to(card, { opacity: 0, y: 12, duration: 0.3, ease: 'power2.in', onComplete: () => { card.hidden = true; gsap.set(card, { clearProps: 'opacity,transform' }); } });
    if (!isDocked()) { dock.hidden = false; state.docked = true; save(state); gsap.from(leafBox, { scale: 0, duration: 0.6, ease: 'back.out(2)' }); }
  });
  dock.addEventListener('click', () => {
    if (opening && !opening.over) return; // (mid-opening: a tap on the leaf only lets her speak)
    if (voice.speaking) { voice.hush(); return; }
    if (!card.hidden) { card.hidden = true; return; }
    openCard(true);
    gsap.from(card, { opacity: 0, y: 14, duration: 0.45, ease: 'expo.out' });
    if (!log.children.length) { say(tc('Hi again! What are you looking for?')); chips(SUGGEST); }
  });
  // a new page can't speak until it's been clicked: the first tap anywhere carries on
  const unlock = () => {
    voice.resumeAudio();
    if (blockedLine) { const l = blockedLine; blockedLine = null; voice.speak(l); }
  };
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
  // the greeting card belongs to the hero: it steps aside once you scroll on
  window.addEventListener('scroll', () => {
    if (!card.hidden && !card.classList.contains('is-docked')) card.classList.toggle('is-away', window.scrollY > innerHeight * 0.35);
  }, { passive: true });
  window.addEventListener('resize', () => { if (!card.hidden && !card.classList.contains('is-docked') && hero) placeBesideHub(); });

  setVoiceState('off');
  if (state.docked) dock.hidden = false;
  // the mic was on before this page: open it again (the browser remembers the permission)
  // reopen the mic on this page only if it's already allowed; otherwise show where things stand
  if (state.voice || state.wantsVoice) {
    enableVoice({ prompt: false }).then(async (ok) => {
      if (!ok && (await voice.permission()) === 'denied') setVoiceState('denied');
    });
  }
  // the header tag says which brain is answering
  // ("Live AI": the Arifa backend, or this site's own AI route; "Preview": the built-in script)
  const tag = card.querySelector<HTMLElement>('.assist__name .mono');
  function showSource() {
    const s = brain.source();
    tag.textContent = tc(s === 'backend' || (s === 'builtin' && brain.usingAI()) ? 'Live AI' : 'Preview');
    tag.title = s === 'backend' ? 'Arifa backend' : s === 'builtin' ? 'Built-in assistant' : '';
  }
  brain.checkRemote().then((ai) => { tag.textContent = tc(ai ? 'Live AI' : 'Preview'); });

  return {
    // the home page's opening conversation takes the visitor to a family:
    // pick up from there on the next page — filter, open one, and keep talking out loud
    handoff(familyId) {
      state.pending = { kind: 'family', id: familyId };
      state.aloud = true;
      state.docked = true;
      save(state);
    },
    // home: the leaves say hello once the hero has settled
    async start({ quiet = false } = {}) {
      if (quiet) { dock.hidden = false; return; }
      if (state.docked) return; // you've already met
      if (!hero) dock.hidden = false;
      openCard(false);
      card.classList.add('is-invite');
      gsap.from(card, { opacity: 0, x: -24, scale: 0.96, duration: 0.8, ease: 'expo.out', transformOrigin: '0% 30%' });
      await say(GREETING);
      chips(SUGGEST);
    },
    // home, once the hero has formed: the opening conversation. Arifa greets the visitor, a visitor
    // answers, and she takes them to that family with her own pointer — spoken (her voice and a
    // second one for the visitor) and captioned here, the leaf glowing as she talks. A page may
    // only speak after a click or tap: until there has been one, she waits for it.
    async opening(heroApi) {
      if (state.pending) return; // (arrive() is carrying on from another page)
      if ((performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward') { dock.hidden = false; return; }
      const op = (opening = { over: false });
      const off = () => op.over;
      if (dock.hidden) { dock.hidden = false; if (!env.reduced) gsap.from(leafBox, { scale: 0, duration: 0.7, ease: 'back.out(2)' }); }
      await wait(0.5);
      if (off()) return;
      log.replaceChildren();
      chips([]);
      openCard(true);
      gsap.from(card, { opacity: 0, y: 14, duration: 0.6, ease: 'expo.out' });

      // the leaf talks: its glow and a lift follow her voice
      const lvl = { now: 0, target: 0 };
      const glow = () => {
        if (voice.speaking) {
          lvl.target = Math.random() < 0.1 ? 0.55 + Math.random() * 0.45 : Math.max(lvl.target * 0.96, 0.32);
          if (Math.random() < 0.09) pulseLeaf();
        } else lvl.target *= 0.86;
        lvl.now += (lvl.target - lvl.now) * 0.2;
        dock.style.setProperty('--lvl', lvl.now.toFixed(3));
        card.style.setProperty('--lvl', lvl.now.toFixed(3));
      };
      gsap.ticker.add(glow);
      const finish = () => { gsap.ticker.remove(glow); dock.style.setProperty('--lvl', '0'); card.style.setProperty('--lvl', '0'); op.over = true; if (opening === op) opening = null; };

      // the browser's permission to speak: a first click or tap
      const activated = () => !canTalk || !!navigator.userActivation?.hasBeenActive;
      if (!activated()) {
        bubble('bot', tc('Hi, I’m Arifa. Tap anywhere and I’ll say hello.'));
        status(tc('Tap anywhere to hear Arifa'), 'invite');
        await new Promise<void>((resolve) => {
          let check = 0;
          const go = () => { clearInterval(check); ['click', 'keydown'].forEach((e) => window.removeEventListener(e, go, true)); resolve(); };
          ['click', 'keydown'].forEach((e) => window.addEventListener(e, go, true));
          check = window.setInterval(() => { if (off()) go(); }, 300);
        });
        if (off()) { finish(); return; }
        status('');
        log.replaceChildren();
        await wait(0.3);
      }
      state.aloud = canTalk; // (she speaks from here on, and on the next page)
      save(state);

      for (const line of OPENING) {
        if (off()) { finish(); return; }
        if (line.who === 'arifa') {
          await say(line.text);
        } else {
          await wait(0.6); // a moment of listening before the visitor answers
          if (off()) { finish(); return; }
          await visitorSays(line.text);
          // the stage turns to what was asked for while she answers
          if (line.family) heroApi?.bringToFront(line.family);
        }
        if (off()) { finish(); return; }
        if (line.go) {
          // (no line or range on this page: straight to the family, from the stage)
          const toured = line.tour && document.querySelector<HTMLElement>('[data-line]') && (await tourLine(line.go, heroApi, off));
          if (!toured && !off()) await takeThere(line.go, heroApi, off);
          finish();
          return;
        }
        await wait(line.who === 'you' ? 0.45 : 0.3);
      }
      finish();
    },
    // any page: carry on what the last page started
    async arrive() {
      const p = state.pending;
      if (!p) return;
      dock.hidden = false;
      openCard(true);
      gsap.from(card, { opacity: 0, y: 14, duration: 0.5, ease: 'expo.out' });
      busy = true;
      try {
        if (p.kind === 'family' && page === 'products' && fam(p.id) && p.pick) {
          // the opening carries on: she asks which one, the visitor names it by its number,
          // and she opens that one and says what it is
          await say(brain.arrived(p.id, { which: true }));
          await wait(0.6);
          await visitorSays(p.pick.text);
          brain.note('user', p.pick.text);
          const go = tc('Good choice. Let me open the {ref} for you.', { ref: p.pick.ref });
          brain.note('assistant', go);
          await say(go);
          await openProduct(p.pick.ref);
          state.pending = null;
          save(state);
        } else if (p.kind === 'family' && page === 'products' && fam(p.id) && p.quiet) {
          state.pending = null; // (the backend's own reply was already said; the filter is on)
          save(state);
        } else if (p.kind === 'family' && page === 'products' && fam(p.id)) {
          await say(brain.arrived(p.id));
          showPointer();
          await wait(0.6);
          await openFirst(fam(p.id));
          state.pending = null;
          save(state);
        } else if (p.kind === 'product' && page === 'products') {
          const card = p.id ? document.querySelector<HTMLElement>(`.pcard[data-product="${CSS.escape(p.id)}"]`) : null;
          await openProduct(p.ref, { narrate: p.narrate !== false, card });
          state.pending = null;
          save(state);
        } else if (p.kind === 'quote' && page === 'contact') {
          await fillQuote(p.fill);
        } else {
          state.pending = null;
          save(state);
        }
      } finally {
        release();
      }
    },
  };
}
