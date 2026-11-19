import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, autoVideo } from '@/lib/env';
import { enquiry } from '@/lib/enquiry';
import type Lenis from 'lenis';
import type { ClientCatalogue } from '@/data/types';
import type { QuickView } from './quickViewClient';
import type { Tray } from './tray';
import { tc } from '@/i18n/client';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s.-]/g, ' ').replace(/\s+/g, ' ').trim();

/*
  Filter · search · layout for the catalogue grid.
  Every product is already in the HTML (crawlable); this only decides what's
  visible, and animates the change: the cards on screen let go, and the new set rises in.
*/
export function initCatalogue({ data, lenis, qv, tray }: { data: ClientCatalogue; lenis: Lenis; qv: QuickView; tray: Tray }) {
  const grid = document.querySelector<HTMLElement>('[data-cat-grid]');
  const bar = document.querySelector<HTMLElement>('[data-cat-bar]');
  const cards = [...grid.querySelectorAll<HTMLElement>('.pcard')];
  const heads = [...grid.querySelectorAll<HTMLElement>('.fhead')];
  const chips = [...document.querySelectorAll<HTMLElement>('.cat-chip')];
  const pill = document.querySelector<HTMLElement>('[data-chip-pill]');
  const search = document.querySelector<HTMLInputElement>('[data-cat-search]');
  const selfBtn = document.querySelector<HTMLElement>('[data-cat-self]');
  const viewBtns = [...document.querySelectorAll<HTMLElement>('[data-view]')].filter((b) => b.tagName === 'BUTTON');
  const countEl = document.querySelector<HTMLElement>('[data-cat-count]');
  const nounEl = document.querySelector<HTMLElement>('[data-cat-noun]');
  const scopeEl = document.querySelector<HTMLElement>('[data-cat-scope]');
  const resets = [...document.querySelectorAll<HTMLElement>('[data-cat-reset]')];
  const empty = document.querySelector<HTMLElement>('[data-cat-empty]');
  const emptyQ = document.querySelector<HTMLElement>('[data-cat-empty-q]');
  const byId = new Map(data.products.map((p) => [p.id, p]));
  const families = new Map(data.families.map((f) => [f.id, f]));

  // ── state, seeded from the URL so filters are shareable ──
  const params = new URLSearchParams(location.search);
  const state = {
    family: families.has(params.get('family')) ? params.get('family') : 'all',
    q: params.get('q') || '',
    self: params.get('range') === 'self',
    view: params.get('view') === 'index' ? 'index' : 'grid',
  };
  search.value = state.q;
  if (matchMedia('(max-width: 600px)').matches) search.placeholder = tc('Code or name — 83185');

  // keep the original ref text so search highlights can be undone
  cards.forEach((c) => {
    const r = c.querySelector<HTMLElement>('.pcard__ref span');
    r.dataset.raw = r.textContent;
  });

  const visibleIds = () => cards.filter((c) => !c.classList.contains('is-hidden')).map((c) => c.dataset.product);

  function matches(c, tokens) {
    if (state.family !== 'all' && c.dataset.family !== state.family) return false;
    if (state.self && c.dataset.range !== 'self') return false;
    return tokens.every((t) => c.dataset.search.includes(t));
  }

  function highlight(tokens) {
    cards.forEach((c) => {
      const r = c.querySelector<HTMLElement>('.pcard__ref span');
      const raw = r.dataset.raw;
      const t = tokens.find((tk) => raw.toLowerCase().includes(tk));
      if (!t) { if (r.innerHTML !== raw) r.textContent = raw; return; }
      const i = raw.toLowerCase().indexOf(t);
      r.innerHTML = `${raw.slice(0, i)}<mark>${raw.slice(i, i + t.length)}</mark>${raw.slice(i + t.length)}`;
    });
  }

  function movePill(animate = true) {
    const active = chips.find((c) => c.dataset.family === state.family) || chips[0];
    chips.forEach((c) => {
      const on = c === active;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    const to = { x: active.offsetLeft, width: active.offsetWidth };
    animate ? gsap.to(pill, { ...to, duration: 0.7, ease: 'expo.out' }) : gsap.set(pill, to);
    // keep the active chip in view inside the scrollable row
    const row = active.parentElement;
    const left = active.offsetLeft - row.clientWidth / 2 + active.offsetWidth / 2;
    row.scrollTo({ left, behavior: animate ? 'smooth' : 'auto' });
  }

  function syncUrl() {
    const u = new URL(location.href);
    const set = (k, v) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set('family', state.family !== 'all' ? state.family : '');
    set('q', state.q);
    set('range', state.self ? 'self' : '');
    set('view', state.view === 'index' ? 'index' : '');
    history.replaceState(null, '', u);
  }

  // on screen right now (only those are worth animating)
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  const showing = () => [...heads, ...cards].filter((e) => !e.classList.contains('is-hidden'));

  let countTween;
  let swap;
  function apply({ animate = true, scrollToTop = false } = {}) {
    const tokens = norm(state.q).split(' ').filter(Boolean);
    // what the filter leaves (the grid itself changes in relay(), once the field has cleared)
    const keep = new Set();
    const famShown = new Set();
    let n = 0;
    cards.forEach((c) => {
      if (!matches(c, tokens)) return;
      keep.add(c);
      famShown.add(c.dataset.family);
      n++;
    });
    heads.forEach((h) => famShown.has(h.dataset.familyHead) && keep.add(h));
    const relay = () => {
      cards.forEach((c) => c.classList.toggle('is-hidden', !keep.has(c)));
      heads.forEach((h) => h.classList.toggle('is-hidden', !keep.has(h)));
      highlight(tokens);
      ScrollTrigger.refresh();
    };

    // A new filter: what's on screen lets go, the grid is laid out afresh in place (no card
    // travels across the page, so nothing can stray over the sections around it), and what the
    // filter leaves rises back in, a wave at a time. Cards further down rise in as they're reached.
    swap?.progress(1); // (a change still in flight finishes first)
    if (!animate || env.reduced) {
      relay();
      cards.forEach((c) => keep.has(c) && onScreen(c) && c.classList.add('is-in'));
    } else {
      // (only what has actually come in: a card still waiting at the foot of the screen is
      // invisible, and its own entrance offset mustn't be caught up in this one)
      const out = showing().filter((el) => onScreen(el) && (!el.classList.contains('pcard') || el.classList.contains('is-in')));
      swap = gsap.timeline()
        .to(out, { opacity: 0, y: 10, duration: 0.22, ease: 'power2.in', stagger: { amount: 0.06 } })
        .add(() => {
          relay();
          const back = showing().filter(onScreen);
          back.forEach((el) => el.classList.contains('pcard') && el.classList.add('is-in', 'is-done'));
          gsap.set(out.filter((el) => !back.includes(el)), { clearProps: 'opacity,transform' });
          gsap.fromTo(back, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.03, clearProps: 'opacity,transform' });
        });
    }

    // status line
    const o = { v: Number(countEl.textContent) || 0 };
    countTween?.kill();
    countTween = gsap.to(o, { v: n, duration: 0.6, ease: 'power2.out', onUpdate: () => { countEl.textContent = String(Math.round(o.v)); } });
    nounEl.textContent = tc(n === 1 ? 'product' : 'products');
    const bits = [];
    if (state.family !== 'all') bits.push(tc('in {family}', { family: families.get(state.family).name }));
    if (state.self) bits.push(tc('· self range'));
    if (state.q) bits.push(tc('· matching “{q}”', { q: state.q }));
    scopeEl.textContent = bits.length ? ` ${bits.join(' ')}` : '';
    const filtered = state.family !== 'all' || state.self || state.q;
    resets[0].hidden = !filtered;
    empty.hidden = n > 0;
    emptyQ.textContent = state.q || families.get(state.family)?.name || '';

    selfBtn.setAttribute('aria-pressed', String(state.self));
    movePill(animate);
    syncUrl();

    if (scrollToTop) {
      const top = grid.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 20;
      if (window.scrollY > top + 10) lenis.scrollTo(top, { duration: 1.1 });
    }
  }

  // ── controls ──
  chips.forEach((c) => c.addEventListener('click', () => {
    if (state.family === c.dataset.family) return;
    state.family = c.dataset.family;
    apply({ scrollToTop: true });
  }));
  selfBtn.addEventListener('click', () => { state.self = !state.self; apply({ scrollToTop: true }); });
  let t;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = search.value.trim(); apply(); }, 140);
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { search.value = ''; state.q = ''; apply(); search.blur(); }
    if (e.key === 'Enter') { e.preventDefault(); apply({ scrollToTop: true }); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName) && !qv.isOpen()) {
      e.preventDefault();
      search.focus();
    }
  });
  resets.forEach((r) => r.addEventListener('click', () => {
    Object.assign(state, { family: 'all', q: '', self: false });
    search.value = '';
    apply({ scrollToTop: true });
  }));

  // grid ↔ index: fade the field down, re-lay it, deal it back in
  function setView(v, animate = true) {
    state.view = v;
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    const shown = [...heads, ...cards].filter((e) => !e.classList.contains('is-hidden'));
    if (!animate) { grid.dataset.view = v; return; }
    gsap.timeline()
      .to(shown, { opacity: 0, y: 14, duration: 0.25, ease: 'power2.in', stagger: { amount: 0.08 } })
      .add(() => {
        grid.dataset.view = v;
        ScrollTrigger.refresh();
        syncUrl();
      })
      .fromTo(shown.slice(0, 40), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.018, clearProps: 'y' })
      .set(shown.slice(40), { opacity: 1, y: 0 }, '<');
  }
  viewBtns.forEach((b) => b.addEventListener('click', () => state.view !== b.dataset.view && setView(b.dataset.view)));

  // ── cards: open, enquire ──
  grid.addEventListener('click', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('.pcard');
    if (!card) return;
    const p = byId.get(card.dataset.product);
    if ((e.target as Element).closest<HTMLElement>('[data-enquire]')) {
      const btn = (e.target as Element).closest<HTMLElement>('[data-enquire]');
      const added = enquiry.toggle(p);
      btn.classList.remove('is-bump');
      void btn.offsetWidth;
      btn.classList.add('is-bump');
      if (added) tray.fly(card.querySelector<HTMLElement>('.pcard__media'), p.img);
      return;
    }
    if ((e.target as Element).closest<HTMLElement>('[data-qv-open]')) {
      // ctrl / cmd / shift / middle click: let the link open the product's own page in a new tab
      const me = e as MouseEvent;
      if (me.ctrlKey || me.metaKey || me.shiftKey || me.altKey || me.button > 0) return;
      e.preventDefault();
      qv.open(p.id, card.querySelector<HTMLImageElement>('.pcard__media img'));
    }
  });
  const syncAdds = () => cards.forEach((c) => {
    const on = enquiry.has(c.dataset.product);
    c.querySelector<HTMLElement>('[data-enquire]').setAttribute('aria-pressed', String(on));
  });
  enquiry.subscribe(syncAdds);
  syncAdds();

  // ── scroll entrance: cards rise in small waves ──
  const io = new IntersectionObserver((entries) => {
    let k = 0;
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const delay = (k++ % 6) * 60;
      (en.target as HTMLElement).style.transitionDelay = `${delay}ms`;
      en.target.classList.add('is-in');
      setTimeout(() => en.target.classList.add('is-done'), 1200 + delay);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  cards.forEach((c) => io.observe(c));
  heads.forEach((h) => {
    const v = h.querySelector<HTMLVideoElement>('video');
    if (v) autoVideo(v);
    gsap.from(h.querySelector<HTMLElement>('.fhead__body').children, {
      y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 88%' },
    });
  });

  // the sticky bar sits below the nav whenever the nav is showing
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const syncBar = () => {
    const navShown = !nav.classList.contains('is-hidden');
    bar.style.setProperty('--bar-top', navShown ? `${nav.offsetHeight}px` : '0px');
  };
  new MutationObserver(syncBar).observe(nav, { attributes: true, attributeFilter: ['class'] });
  syncBar();
  ScrollTrigger.create({ trigger: bar, start: 'top top+=80', end: 'max', toggleClass: { targets: bar, className: 'is-stuck' } });

  // first paint
  grid.dataset.view = state.view;
  viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  apply({ animate: false });
  requestAnimationFrame(() => movePill(false));

  return { visibleIds, state };
}
