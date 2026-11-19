import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { env } from '@/lib/env';
import { whenRenderer } from '@/three/renderers';
import { isArPage, tc } from '@/i18n/client';

/*
  Clients & Industries.
  · The delivery route (white): the Arifa factory in a 3D town on a street grid; scroll packs cartons
    at the dock and sends them down the street to each industry in turn, a green trail behind them,
    to stack at its door; the card beside it shows that
    stop's use, its product kit and a quote link. Pins over the buildings name each industry and
    tick when it's been delivered. Narrow screens get the same scene with the card below; reduced
    motion or no WebGL get the stops stacked, no scene.
  · The pallet: scroll builds it, a row at a time from the bottom, left to right. Each client is a
    carton seen a little from above: its printed front and its top. It drops onto the stack from
    above with the top split open, lands and settles, the two flaps fold shut, the tape runs along
    the top seam and on down the front, and its logo prints on, top to bottom. Then the stack is
    stretch-wrapped. Wide screens hold the pallet still while it's built; narrower ones build each
    row as it scrolls into view. Scrolling back takes it apart again.
*/

function initRoute(lenis) {
  const sec = document.querySelector<HTMLElement>('[data-route]');
  if (!sec) return { intro() {} };
  const stage = sec.querySelector<HTMLElement>('[data-route-stage]');
  const pinsEl = sec.querySelector<HTMLElement>('[data-route-pins]');
  const stops = [...sec.querySelectorAll<HTMLElement>('[data-stop]')];
  const gos = [...sec.querySelectorAll<HTMLElement>('[data-route-go]')];
  const head = sec.querySelector<HTMLElement>('.route__head');
  const n = stops.length;
  const still = env.reduced || !env.webgl;
  if (still) { sec.classList.add('is-still'); return { intro() {} }; }
  sec.classList.add('is-live');
  // The heading sits at the top of the screen and the stop card at the foot. When a screen is too
  // short for both, the card would ride up over the heading: then it waits until the heading has
  // faded on the first scroll (main CSS: .cl-route.is-crowded), so the one never sits over the other.
  // (offsetTop: layout positions, which the entrance animations' transforms don't change)
  const card = sec.querySelector<HTMLElement>('[data-route-card]');
  // Phones and narrow tablets have no room for the heading, the town and the card at once, so
  // there the card always waits for the heading to fade, and the town sits in the space between.
  const narrow = () => window.innerWidth < 900;
  const fit = () => sec.classList.toggle('is-crowded', narrow() || card.offsetTop < head.offsetTop + head.offsetHeight + 16);

  // pins over the buildings
  const pins = stops.map((s) => {
    const el = document.createElement('span');
    el.className = 'route-pin';
    el.innerHTML = `<i></i>${s.dataset.label}`;
    pinsEl.appendChild(el);
    return el;
  });

  let scene = null;
  let helpers = null;
  let target = 0;
  let p = 0;
  let at = -1;
  let trig = null;
  let visible = false;

  const setHeight = () => { sec.style.height = `${n * 95 + 170}vh`; };
  setHeight();

  const show = (i) => {
    if (i === at) return;
    at = i;
    stops.forEach((s, k) => s.classList.toggle('is-active', k === i));
    gos.forEach((g, k) => g.classList.toggle('is-active', k === i));
    fit(); // (each stop's card is its own height)
    if (!env.reduced) {
      gsap.fromTo(stops[i].querySelectorAll<HTMLElement>('.route__kicker, .route__name, .route__use, .kit, .route__more, .btn'), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.045, overwrite: true });
    }
  };
  const anchor = () => {
    const wide = window.innerWidth >= 900;
    const r = stage.getBoundingClientRect();
    // the town is framed away from the words: right of them in English, left of them on /ar (right to left)
    return wide ? [r.width * (isArPage() ? 0.34 : 0.66), r.height * 0.54] : [r.width * 0.5, narrowY ?? freeMiddle()];
  };
  // narrow screens: the middle of the free space, below the heading at first, then above the stop
  // card once the heading has faded and the card has come up
  let narrowY = null;
  const freeMiddle = () => {
    const r = stage.getBoundingClientRect();
    const past = sec.classList.contains('is-past-head');
    const top = past ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64) : head.getBoundingClientRect().bottom - r.top;
    const bottom = past ? card.getBoundingClientRect().top - r.top : r.height;
    return (top + bottom) / 2;
  };
  const followSpace = () => {
    if (!scene || !narrow()) { narrowY = null; return; }
    const want = freeMiddle();
    const y = narrowY == null ? want : narrowY + (want - narrowY) * 0.12;
    if (narrowY == null || Math.abs(y - narrowY) > 0.3) {
      narrowY = y;
      scene.setAnchor(...anchor());
      sec.style.setProperty('--town-y', `${Math.round((y / stage.getBoundingClientRect().height) * 100)}%`);
    }
  };

  function draw() {
    if (!scene) return;
    followSpace();
    scene.setProgress(p);
    if (scene.frame()) {
      const pos = scene.pins();
      const cur = helpers.stopAt(p, n);
      pos.forEach((q, k) => {
        const el = pins[k];
        el.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, -100%)`;
        el.style.opacity = q.on ? '1' : '0';
        const delivered = p >= helpers.stopStart(k, n) + cur.w * 0.86;
        el.classList.toggle('is-done', delivered);
        el.classList.toggle('is-active', k === cur.i && !cur.intro);
      });
    }
    const cur = helpers.stopAt(p, n);
    show(cur.i);
    head.style.opacity = String(Math.max(0, 1 - p / 0.06));
    sec.classList.toggle('is-moving', p > 0.02);
    sec.classList.toggle('is-past-head', p > 0.05); // (the heading has all but faded)
  }
  function tick(time, dt) {
    const d = target - p;
    const ease = 1 - Math.pow(0.86, Math.min(dt, 100) / 16.7);
    p = Math.abs(d) < 0.0004 ? target : p + d * ease;
    draw();
  }

  async function load() {
    if (scene) return;
    const mod = await import('@/three/scenes/DeliveryScene');
    const { logoMarkup } = await import('@/three/parts/arifaFactory');
    helpers = { stopAt: mod.stopAt, stopStart: mod.stopStart };
    try {
      const renderer = await whenRenderer('delivery');
      if (!renderer) throw new Error('no WebGL renderer');
      scene = new mod.DeliveryScene(renderer, stops.map((s) => s.dataset.id), { lowPower: env.lowPower });
      scene.setSign(logoMarkup());
    } catch (err) {
      console.warn('Delivery scene: no WebGL, stops only.', err);
      sec.classList.remove('is-live');
      sec.classList.add('is-still');
      sec.style.height = '';
      return;
    }
    layout();
    draw();
    if (visible) gsap.ticker.add(tick);
  }
  function layout() {
    if (!scene) return;
    const r = stage.getBoundingClientRect();
    scene.resize(r.width, r.height);
    scene.setAnchor(...anchor());
  }

  ScrollTrigger.create({ trigger: sec, start: 'top bottom+=100%', once: true, onEnter: load });
  ScrollTrigger.create({
    trigger: sec, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      if (!scene) return;
      if (visible) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    },
  });
  trig = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { target = self.progress; } });
  // a stop's number jumps to the moment its carton lands
  gos.forEach((g, k) => g.addEventListener('click', () => {
    if (!trig || !helpers) return;
    const w = helpers.stopAt(0.5, n).w;
    const y = trig.start + (trig.end - trig.start) * (helpers.stopStart(k, n) + w * 0.92);
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  }));
  window.addEventListener('resize', () => { fit(); layout(); if (scene) { scene.dirty = true; draw(); } });
  if (process.env.NODE_ENV === 'development') window.__route = { load, get scene() { return scene; }, set: (v) => { target = p = v; draw(); } };

  const lines = sec.querySelectorAll<HTMLElement>('.route__title .cl-line > span');
  const rest = sec.querySelectorAll<HTMLElement>('.route__head .eyebrow, .route__lede, .route__card');
  if (!env.reduced) {
    gsap.set(lines, { yPercent: 110 });
    gsap.set(rest, { opacity: 0, y: 16 });
  }
  return {
    intro() {
      load();
      if (env.reduced) return;
      gsap.timeline()
        .to(lines, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, 0.1)
        .to(rest, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.35);
    },
  };
}

function initPallet() {
  const sec = document.querySelector<HTMLElement>('.cl-pallet');
  const pallet = sec?.querySelector<HTMLElement>('.pallet');
  const crates = sec ? gsap.utils.toArray<HTMLElement>('.crate', sec) : [];
  if (!pallet || !crates.length) return;
  const stack = pallet.querySelector<HTMLElement>('.pallet__stack');
  const colsNow = () => getComputedStyle(stack).gridTemplateColumns.split(' ').length;
  const rowsOf = (cols) => Array.from({ length: Math.ceil(crates.length / cols) }, (_, r) => crates.slice(r * cols, r * cols + cols));
  // stacking order: each row over the one below it, so a lower carton's top tucks under the row above
  const stackOrder = () => {
    const rows = rowsOf(colsNow());
    rows.forEach((row, r) => row.forEach((el) => { el.style.zIndex = String(rows.length - r); }));
  };
  stackOrder();
  window.addEventListener('resize', stackOrder);
  if (env.reduced) return;
  const base = pallet.querySelector<HTMLElement>('.pallet__base');
  const legs = base.querySelectorAll<HTMLElement>('i');
  const film = pallet.querySelector<HTMLElement>('.pallet__film');
  const note = sec.querySelector<HTMLElement>('.cl-pallet__note');

  // one carton, start to finish (about 1.9 units): it drops onto the stack from above with its top
  // split open, lands and settles, its two flaps fold shut, the tape runs along the top seam and on
  // down the front, and its logo prints on, top to bottom
  function crate(el) {
    const h = el.offsetHeight;
    const box = el.querySelector('.crate__box');
    const [ll, lr] = el.querySelectorAll('.crate__lid');
    return gsap.timeline()
      .fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none' }, 0)
      .fromTo(box, { y: -h * 1.8 }, { y: 0, duration: 0.62, ease: 'power2.in' }, 0)
      .fromTo(ll, { rotationY: 120 }, { rotationY: 0, duration: 0.46, ease: 'back.out(1.3)' }, 0.7)
      .fromTo(lr, { rotationY: -120 }, { rotationY: 0, duration: 0.46, ease: 'back.out(1.3)' }, 0.8)
      .set(box, { transformOrigin: '50% 100%' }, 0.62) // it settles onto its bottom edge
      .to(box, { scaleX: 1.025, scaleY: 0.94, duration: 0.07, ease: 'power2.out' }, 0.62)
      .to(box, { scaleX: 1, scaleY: 1, duration: 0.34, ease: 'back.out(3)' }, 0.69)
      .fromTo(el.querySelector('.crate__tape--top'), { scaleY: 0 }, { scaleY: 1, duration: 0.2, ease: 'power1.in' }, 1.24)
      .fromTo(el.querySelector('.crate__tape--front'), { scaleY: 0 }, { scaleY: 1, duration: 0.24, ease: 'power2.out' }, 1.42)
      .fromTo(el.querySelector('.crate__logo'), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, ease: 'power2.inOut' }, 1.5)
      .fromTo(el.querySelectorAll('.crate__ind, .sample-tag'), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.06, ease: 'power2.out' }, 1.7);
  }
  // the pallet slides in under them
  const palletIn = () => gsap.timeline()
    .fromTo(base, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, 0)
    .fromTo(legs, { scaleY: 0 }, { scaleY: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' }, 0.2);
  // and the finished stack is stretch-wrapped: the film winds up from the pallet, a sheen runs across
  const wrapUp = () => gsap.timeline()
    .fromTo(film, { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power1.inOut' }, 0)
    .fromTo(film, { backgroundPosition: '0% 0%, 100% 0%, 0% 0%' }, { backgroundPosition: '0% 0%, 0% 0%, 0% 0%', duration: 0.7, ease: 'power1.inOut' }, 0.4)
    .to(film, { autoAlpha: 0.4, duration: 0.3, ease: 'none' }, 0.95)
    .fromTo(note, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.7);

  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px) and (min-height: 640px)', narrow: '(max-width: 899px), (max-height: 639px)' }, (ctx) => {
    const { wide } = ctx.conditions;
    sec.classList.add('is-anim');
    sec.classList.toggle('is-pinned', wide);
    const cols = colsNow();
    const rows = rowsOf(cols);
    stackOrder();
    if (wide) {
      // the pallet holds still on screen and scroll builds it: bottom row first, left to right,
      // each carton dropped on from above
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec.querySelector<HTMLElement>('.pallet-track'), start: 'top 15%', end: 'bottom bottom', scrub: 0.8 } });
      tl.add(palletIn(), 0);
      [...rows].reverse().flat().forEach((el, n) => tl.add(crate(el), 0.35 + n * 0.34));
      tl.add(wrapUp(), tl.duration() - 0.15);
      tl.to({}, { duration: 0.5 }); // a beat on the finished pallet before it scrolls away
    } else {
      // narrower screens: no hold; each row builds itself, left to right, as it scrolls into view
      // (positions from offsetTop, which the cartons' own movement doesn't change)
      rows.forEach((row) => {
        const top = () => row[0].offsetTop;
        const tl = gsap.timeline({ scrollTrigger: { trigger: pallet, start: () => `top+=${top()} 100%`, end: () => `top+=${top()} 45%`, scrub: 0.6 } });
        row.forEach((el, k) => tl.add(crate(el), k * 0.3));
      });
      gsap.timeline({ scrollTrigger: { trigger: pallet, start: () => `top+=${base.offsetTop} 100%`, end: () => `top+=${base.offsetTop} 60%`, scrub: 0.6 } })
        .add(palletIn(), 0)
        .add(wrapUp(), 0.3);
    }
    return () => sec.classList.remove('is-anim', 'is-pinned');
  });
}

function initStories() {
  const section = document.querySelector<HTMLElement>('[data-stories]');
  if (!section) return;
  const panels = [...section.querySelectorAll<HTMLElement>('[data-story]')];
  const tabs = [...section.querySelectorAll<HTMLElement>('[data-story-tab]')];
  if (!panels.length || tabs.length !== panels.length) return;
  const navigation = section.querySelector<HTMLElement>('[data-story-navigation]');
  const tablist = section.querySelector<HTMLElement>('[data-story-tabs]');
  const current = section.querySelector<HTMLElement>('[data-story-current]');
  const status = section.querySelector<HTMLElement>('[data-story-status]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;

  // Upgrade the fully readable static stories into a manually controlled tab interface.
  // No autoplay: visitors keep their place while reading a quote or following its links.
  tablist.setAttribute('role', 'tablist');
  panels.forEach((panel, i) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[i].id);
    panel.tabIndex = 0;
    tabs[i].setAttribute('role', 'tab');
    tabs[i].setAttribute('aria-controls', panel.id);
  });

  function show(index, { focus = false, announce = true, animate = true } = {}) {
    selected = (index + panels.length) % panels.length;
    panels.forEach((panel, i) => {
      const active = i === selected;
      panel.hidden = !active;
      tabs[i].setAttribute('aria-selected', String(active));
      tabs[i].tabIndex = active ? 0 : -1;
    });
    current.textContent = String(selected + 1).padStart(2, '0');
    if (focus) tabs[selected].focus({ preventScroll: true });
    if (announce) status.textContent = tc('{sector}, story {n} of {total}.', { sector: tabs[selected].querySelector<HTMLElement>('strong').textContent, n: selected + 1, total: panels.length });
    const active = panels[selected];
    const photo = active.querySelector<HTMLImageElement>('.story__photo');
    // Hidden panels retain lazy images; begin fetching when their story is selected.
    if (photo) photo.loading = 'eager';
    if (animate && !reduced.matches && active.animate) {
      active.getAnimations().forEach((animation) => animation.cancel());
      active.animate([{ opacity: 0.35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    ScrollTrigger.refresh();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { if (i !== selected) show(i); });
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = selected + 1;
      if (event.key === 'ArrowLeft') next = selected - 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = panels.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      show(next, { focus: true });
    });
  });
  section.querySelector<HTMLElement>('[data-story-prev]').addEventListener('click', () => show(selected - 1));
  section.querySelector<HTMLElement>('[data-story-next]').addEventListener('click', () => show(selected + 1));
  navigation.hidden = false;
  section.classList.add('is-interactive');
  show(0, { announce: false, animate: false });
}

export function initClients({ lenis }: { lenis?: Lenis } = {}) {
  const route = initRoute(lenis);
  initPallet();
  initStories();
  return { intro() { route.intro(); } };
}
