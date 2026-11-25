import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { SplitText } from 'gsap/SplitText';
import { env } from '@/lib/env';
import { handoff } from '@/motion/loader';
import { DotField } from '@/three/scenes/DotField';
import { buildHeroProducts, PRODUCT_VIEW } from '@/three/parts/heroProducts';
import { getRenderer } from '@/three/renderers';
import { isArPage, tc } from '@/i18n/client';

gsap.registerPlugin(ScrambleTextPlugin);

/*
  The hero: the range, in dots — and then for real.

  Warm dust gathers into the first product, and the dots become the product itself:
  the real thing, in 3D, lit in a studio and swaying gently, every one carrying the Arifa
  Pack mark (src/three/parts/heroProducts.ts). Then it breaks
  back into its dots, which gather into the next — container, foil, platter, cutlery,
  pot, film, cup, microwave — each named underneath and linked to its page. The family
  index along the bottom chooses one (hover, focus or tap); the button pauses the motion.
*/
const MORPH = 1.9;  // seconds for the dots to gather into a product
const FUSE = 1.15;  // …to become the product
const SHOW = 2.5;   // …that it stays
const MELT = 0.75;  // …to break back into dots
const LEAVE = MELT * 0.55; // (the dots set off before the picture has quite gone)
const PERIOD = LEAVE + MORPH + FUSE + SHOW;

export function initHero(lenis) {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  const inner = root.querySelector<HTMLElement>('[data-hero-inner]');
  const labels = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const links = labels.map((l) => l.querySelector<HTMLAnchorElement>('a'));
  const lines = root.querySelectorAll<HTMLElement>('[data-hero-line]');
  const reveals = root.querySelectorAll<HTMLElement>('[data-hero-reveal]');
  const caption = root.querySelector<HTMLElement>('[data-hero-family]');
  const capN = caption.querySelector<HTMLElement>('[data-family-n]');
  const capLink = caption.querySelector<HTMLAnchorElement>('[data-family-link]');
  const capName = caption.querySelector<HTMLElement>('[data-family-name]');
  const capCount = caption.querySelector<HTMLElement>('[data-family-count]');
  const motion = root.querySelector<HTMLElement>('[data-hero-motion]');
  const sub = root.querySelector<HTMLElement>('[data-hero-sub]');
  const cta = root.querySelector<HTMLElement>('[data-hero-cta]');
  const beam = root.querySelector<HTMLElement>('[data-hero-beam]');
  const cue = root.querySelector<HTMLElement>('[data-hero-scroll]');
  const dock = root.querySelector<HTMLElement>('[data-hero-dock]');

  // the hero without 3D: headline, line and button as usual, and the families as photo cards
  // (sections.css "without WebGL")
  const photoCards = () => {
    root.classList.remove('has-dots');
    root.classList.add('no-gl');
    gsap.killTweensOf([caption, cue, dock, cta, sub, ...reveals]);
    gsap.set([cue, dock, cta, sub, ...reveals], { opacity: 1, y: 0, yPercent: 0, filter: 'none' });
    gsap.set(root.querySelectorAll('.hero__word, [data-hero-sub] *, [data-hero-cta] span'), { opacity: 1, y: 0, yPercent: 0, filter: 'none' });
  };
  if (!env.webgl || !labels.length) {
    photoCards();
    const cards = labels;
    return {
      ready: Promise.resolve(),
      intro: () => (env.reduced ? undefined : gsap.from(cards, { opacity: 0, y: 20, duration: 1, stagger: 0.06, ease: 'expo.out' })),
    };
  }
  root.classList.add('has-dots');
  root.style.setProperty('--n', String(labels.length));

  // the products in 3D (built while the page loads; until then, and without them, the drawn dot shapes)
  const keys = labels.map((l) => l.dataset.step);
  let products = null;
  const stage = (m) => m?.forEach((object, k) => field?.addProduct(k, object, PRODUCT_VIEW[k]));
  const built = buildHeroProducts({ lowPower: env.lowPower })
    .then((m) => { products = m; stage(m); })
    .catch((err) => console.warn('Hero products unavailable, showing dots only.', err));

  // the headline, word by word, each line lit from white on the left to stone grey on the right
  const words = [...lines].flatMap((line) => {
    const split = SplitText.create(line, { type: 'words', wordsClass: 'hero__word', aria: 'none' }); // (aria none: screen readers read the words themselves; a label isn't allowed on a plain span)
    (split.words as HTMLElement[]).forEach((w, i, all) => {
      const t = all.length > 1 ? i / (all.length - 1) : 0;
      const v = Math.round(244 - t * 96);
      w.style.color = `rgb(${v}, ${v - 3}, ${v - 8})`;
    });
    return split.words;
  });
  const subSplit = SplitText.create(sub, { type: 'lines' });
  const subLines = subSplit.lines;
  const ctaLabel = cta.querySelectorAll<HTMLElement>('span');

  // held back for the entrance
  if (!env.reduced) {
    gsap.set(words, { opacity: 0, yPercent: 38, filter: 'blur(14px)' });
    gsap.set(subLines, { opacity: 0, y: 10, filter: 'blur(8px)' });
    gsap.set(cta, { opacity: 0 });
    gsap.set(reveals, { opacity: 0, y: 12 });
    gsap.set([caption, cue, dock], { opacity: 0, y: 10 });
    gsap.set(beam, { opacity: 0 });
  }
  // Scroll: on to the next section
  cue?.addEventListener('click', () => lenis?.scrollTo(root.nextElementSibling || innerHeight, { duration: 1.4 }));

  // a soft light follows the pointer across the stage
  root.addEventListener('pointermove', (e) => {
    const r = inner.getBoundingClientRect();
    inner.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
    inner.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
  }, { passive: true });

  let field = null;
  let current = 0;
  let morphing = null;
  let cycle = null;
  let hovering = false;
  let held = false; // the assistant is holding the stage on one family
  let paused = env.reduced;
  const total = String(labels.length).padStart(2, '0');

  // where the range stands: beside the headline on wide screens, under it on narrow ones
  const anchor = () => {
    const w = field.w, h = field.h;
    return w >= 900
      ? { x: w * 0.21, y: h * 0.02, s: Math.min(w * 0.31, h * 0.54) }
      : { x: 0, y: -h * 0.1, s: Math.min(w * 0.62, h * 0.32) };
  };
  const placeCaption = () => {
    const a = anchor();
    caption.style.left = `${field.w / 2 + a.x}px`;
    caption.style.top = `${field.h / 2 - a.y + a.s * 0.47}px`;
  };

  // name the family the dots are forming
  const name = (i, animate) => {
    const l = labels[i];
    const link = links[i];
    capN.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`;
    capLink.href = link.getAttribute('href');
    capCount.textContent = l.querySelector<HTMLElement>('em')?.textContent.trim() || '';
    const text = l.querySelector<HTMLElement>('.hero__label-t').textContent.trim();
    // (Arabic letters join up, so on /ar the name is simply swapped in rather than scrambled)
    if (animate && !isArPage()) gsap.to(capName, { scrambleText: { text, chars: 'ARIFAPCK', speed: 0.7 }, duration: 0.9, ease: 'none' });
    else capName.textContent = text;
    labels.forEach((el, k) => el.classList.toggle('is-active', k === i));
  };

  // the product as dots: scattered over the 3D product itself (so dots and product match exactly),
  // or, until that is built, the family's drawn shape
  const shapeFor = (i) => {
    const a = anchor();
    const p = { s: a.s, off: { x: a.x, y: a.y } };
    return field.hasProduct(keys[i]) ? field.productShape(keys[i], p) : field.family(keys[i], p);
  };

  // the dots become the real thing: the product comes through a screen of dots as the dots go
  const reveal = () => field.productU.uReveal;
  const fuse = (k) => gsap.timeline()
    .add(() => field.showProduct(k))
    .fromTo(reveal(), { value: 0 }, { value: 1, duration: FUSE, ease: 'power2.inOut', immediateRender: false }, 0)
    .to(field.u.uAlpha, { value: 0, duration: FUSE * 0.85, ease: 'power1.inOut' }, FUSE * 0.2);

  // ── one family after another ──
  const progressBar = { v: 0 };
  const drawProgress = () => labels.forEach((el, k) => el.style.setProperty('--p', k === current ? progressBar.v.toFixed(3) : '0'));
  function schedule() {
    cycle?.kill();
    gsap.killTweensOf(progressBar);
    progressBar.v = 0;
    drawProgress();
    if (!field || paused || hovering || held || env.reduced) return;
    cycle = gsap.to(progressBar, { v: 1, duration: PERIOD, ease: 'none', onUpdate: drawProgress, onComplete: () => go((current + 1) % labels.length) });
  }
  function go(i, { immediate = env.reduced } = {}) {
    if (!field) return; // (no 3D, or it was lost: the photo cards are the index)
    if (i === current && morphing) { schedule(); return; }
    current = i;
    name(i, !immediate);
    morphing?.kill();
    const real = field.hasProduct(keys[i]);
    if (immediate) {
      field.set(shapeFor(i));
      if (real) field.showProduct(keys[i]);
      reveal().value = real ? 1 : 0;
      field.u.uAlpha.value = real ? 0 : 1;
      morphing = null;
    } else {
      // the product on show breaks back into its dots, which gather into the next one…
      const showing = reveal().value > 0.001;
      morphing = gsap.timeline();
      if (showing) morphing.to(reveal(), { value: 0, duration: MELT, ease: 'power1.in' }, 0);
      morphing.to(field.u.uAlpha, { value: 1, duration: MELT * 0.7, ease: 'power1.out' }, 0)
        .add(field.morph(shapeFor(i), { duration: MORPH, spread: 0.5, swirl: 150 }), showing ? LEAVE : 0);
      // …and become the real thing
      if (real) morphing.add(fuse(keys[i]));
    }
    schedule();
  }

  // the index: hover or focus forms that family (and holds it); a click opens its page
  labels.forEach((el, i) => {
    const pick = () => { hovering = true; if (i !== current) go(i); else schedule(); };
    const release = () => { hovering = false; schedule(); };
    el.addEventListener('pointerenter', pick);
    el.addEventListener('pointerleave', release);
    el.addEventListener('focusin', pick);
    el.addEventListener('focusout', release);
  });

  const updateMotion = () => {
    motion?.setAttribute('aria-pressed', String(paused));
    if (motion) { motion.textContent = tc(paused ? 'Play' : 'Pause'); motion.setAttribute('aria-label', tc(paused ? 'Play motion' : 'Pause motion')); }
  };
  updateMotion();
  motion?.addEventListener('click', () => {
    paused = !paused;
    if (field) field.paused = paused;
    updateMotion();
    schedule();
  });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    env.reduced = e.matches;
    paused = e.matches;
    if (field) { field.paused = paused; field.u.uDrift.value = paused ? 0 : 1.2; }
    updateMotion();
    schedule();
  });

  // the dots themselves: a click on the shape opens the family it's showing
  const overShape = (e) => {
    if (!field) return false;
    const r = field.canvas.getBoundingClientRect();
    const a = anchor();
    const dx = e.clientX - r.left - (field.w / 2 + a.x);
    const dy = e.clientY - r.top - (field.h / 2 - a.y);
    return Math.hypot(dx / 1.3, dy) < a.s * 0.42;
  };
  const wire = () => {
    const c = field.canvas;
    c.addEventListener('pointermove', (e) => {
      const over = overShape(e);
      if (over === !!c.dataset.cursorText) return;
      if (over) c.dataset.cursorText = tc('View');
      else delete c.dataset.cursorText;
      c.style.cursor = over ? 'pointer' : '';
      c.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); // let the cursor re-read it
    });
    c.addEventListener('click', (e) => { if (overShape(e)) window.location.href = links[current].getAttribute('href'); });
  };

  // the graphics context was lost mid-visit (src/three/renderers.ts): the photographs take over
  window.addEventListener('arifa:gl-lost', (e) => {
    if ((e as CustomEvent).detail?.name !== 'hero') return;
    cycle?.kill();
    morphing?.kill?.();
    field?.stop();
    field = null;
    photoCards();
  });

  // render only while the hero is on screen
  let visible = true;
  ScrollTrigger.create({
    trigger: root, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { visible = s.isActive; if (field) (visible ? field.start() : field.stop()); },
  });

  // ── scroll: the hero stays behind as the page slides over it ──
  if (!env.reduced) {
    // the card eases back a little as the page comes up over it
    // (from its true size, stated outright: whatever else touched it while the page loaded, the top of
    //  the page is always the hero at 100%)
    gsap.fromTo(inner, { scale: 1, yPercent: 0 }, { scale: 0.94, yPercent: 6, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
  }
  // (a turning shape turns a little faster with the scroll; a product only sways)
  lenis?.on('scroll', ({ velocity }) => { if (field && !paused && field.poseB.spin) field.poseB.y += velocity * 0.0006; });

  // ── the entrance ──
  function intro() {
    try {
      const renderer = getRenderer('hero');
      if (!renderer) throw new Error('no WebGL renderer');
      field = new DotField(renderer, { count: env.small ? 7000 : env.lowPower ? 10000 : 14000 });
      field.u.uDrift.value = env.reduced ? 0 : 1.2;
    } catch (err) {
      console.warn('Hero dots unavailable, showing photographs.', err);
      photoCards();
      return Promise.resolve();
    }
    if (process.env.NODE_ENV === 'development') window.__hero = { field, go };
    stage(products);
    field.paused = paused;
    field.onResize = () => {
      if (!field) return;
      const a = anchor();
      Object.assign(field.poseB, { s: a.s });
      field.poseB.off.set(a.x, a.y, 0);
      placeCaption();
    };
    wire();
    if (visible) field.start();
    placeCaption();
    name(0, false);

    if (env.reduced) {
      field.set(shapeFor(0));
      const real = field.hasProduct(keys[0]);
      if (real) { field.showProduct(keys[0]); reveal().value = 1; }
      field.u.uAlpha.value = real ? 0 : 1;
      return Promise.resolve();
    }

    // (from the landing, the stage's light is still coming up: the hero waits until it is nearly there)
    const tl = gsap.timeline({ delay: handoff.delay || 0 });
    handoff.delay = 0;
    // warm dust drifts in the card, then gathers into the first family — and becomes it
    field.set(field.dust());
    field.u.uDrift.value = 16;
    tl.fromTo(field.u.uAlpha, { value: 0 }, { value: 1, duration: 1.2, ease: 'power1.out' }, 0)
      .add(field.morph(shapeFor(0), { duration: 2.3, spread: 0.55, swirl: 150 }), 0.35)
      .to(field.u.uDrift, { value: 1.2, duration: 2, ease: 'power2.out' }, 0.35);
    // (held as the current morph, so a family chosen meanwhile takes over from it cleanly)
    if (field.hasProduct(keys[0])) tl.add(morphing = fuse(keys[0]), 2.65);
    // the light comes up in the corner; the headline arrives word by word, out of focus into focus
    tl.to(beam, { opacity: 1, duration: 2.6, ease: 'power1.inOut' }, 0.1)
      .to(reveals, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0.3)
      .to(words, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.25, ease: 'power3.out', stagger: 0.11, clearProps: 'filter' }, 0.45)
      .to(subLines, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', stagger: 0.14, clearProps: 'filter' }, 1.1);
    // the button: a single dot, then it opens out into the pill
    const w = cta.offsetWidth, h = cta.offsetHeight;
    const side = Math.max(0, (w - h) / 2);
    tl.set(cta, { opacity: 1, clipPath: `inset(0px ${side}px 0px ${side}px round 999px)`, scale: 0 }, 1.45)
      .set(ctaLabel, { opacity: 0 }, 1.45)
      .to(cta, { scale: 0.42, duration: 0.45, ease: 'back.out(2.4)' }, 1.45)
      .to(cta, { scale: 1, clipPath: 'inset(0px 0px 0px 0px round 999px)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath,transform' }, 1.95)
      .to(ctaLabel, { opacity: 1, duration: 0.5, ease: 'power1.out', stagger: 0.08 }, 2.45)
      .to(caption, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 1.6)
      .add(() => name(0, true), 1.6)
      .to([cue, dock], { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }, 1.9)
      .add(schedule, 2.4)
      .add(() => subSplit.revert(), 2.6); // (so the line breaks can reflow again)
    return tl;
  }

  // for the assistant (src/assistant/assistant.ts): find a family's tab, and bring that family onto the stage
  // and hold it there, resolving once it stands there for real
  const assist = {
    labelFor: (id) => labels.find((l) => l.dataset.family === id) || null,
    bringToFront(id) {
      const i = labels.findIndex((l) => l.dataset.family === id);
      if (i < 0 || !field) return Promise.resolve();
      held = true;
      go(i);
      const formed = morphing ? morphing.then(() => {}) : Promise.resolve();
      return Promise.race([formed, new Promise((r) => setTimeout(r, 4500))]);
    },
    hold(on) { held = on; schedule(); },
  };

  // (the products, if they come quickly: the hero opens on the first)
  return { intro, assist, ready: Promise.race([built, new Promise((r) => setTimeout(r, 2500))]) };
}
