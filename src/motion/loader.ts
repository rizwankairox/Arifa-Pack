import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { env, fontsReady } from '@/lib/env';

gsap.registerPlugin(DrawSVGPlugin);

// Resolve when the media can start, or give up after `ms` so nobody waits on a slow link.
function videoReady(v: HTMLVideoElement | null, ms: number) {
  return new Promise<void>((res) => {
    if (!v || v.readyState >= 3) return res();
    const done = () => res();
    v.addEventListener('canplay', done, { once: true });
    v.addEventListener('error', done, { once: true });
    setTimeout(done, ms);
  });
}
function imageReady(src: string, ms: number) {
  return new Promise<void>((res) => {
    const i = new Image();
    i.onload = i.onerror = () => res();
    i.src = src;
    setTimeout(res, ms);
  });
}
// Home: how the hero should pick up from the loader (src/sections/home/hero.ts reads it in intro())
export const handoff = { delay: 0 };

/*
  The loader.

  Home (full motion): the hero's own dark, with the logo itself at its centre — each leaf
  traced as a fine green line from the bottom up, then filled; the lettering (the logo's
  own, ARIFA then PACK) fading in letter by letter; the count running along the foot.
  Then the landing becomes the home page — one dark, no change of ground: the letters
  fade away left to right, the leaves fly up into the nav, the stage's light comes up
  underneath, the nav's links drop in, and the hero builds itself (src/sections/home/hero.ts).
  Any click, key or wheel fast-forwards; "Skip intro" goes straight to the end.

  Every other page (and home with reduced motion, or opened at an anchor): the logo
  is traced and filled, the count runs to 100, and the curtain lifts while the mark
  flies into the nav.
*/
export type LoaderOptions = {
  /** selectors of videos on the page that should be ready before the curtain lifts */
  videos?: string[];
  /** image URLs worth having before the curtain lifts */
  images?: string[];
};

export function runLoader({ videos = [], images = [] }: LoaderOptions = {}): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-loader]');
  if (!root) return Promise.resolve();
  // full intro once per session; page-to-page moves get a quick curtain
  let seen = false;
  try { seen = sessionStorage.getItem('arifa-intro') === '1'; sessionStorage.setItem('arifa-intro', '1'); } catch {}
  const navLogo = document.querySelector<HTMLElement>('[data-nav-logo]');
  const navSvg = navLogo?.querySelector<SVGSVGElement>('.logo-svg');
  const card = document.querySelector<HTMLElement>('[data-hero-inner]');
  const cinematic = !!(card && navSvg) && !env.reduced && !location.hash;

  // loading: real progress (fonts, first media), smoothed, with a floor so the mark always finishes drawing
  const fast = env.reduced || seen;
  const tasks = [
    fontsReady,
    ...videos.map((sel) => videoReady(document.querySelector<HTMLVideoElement>(sel), fast ? 2500 : 8000)),
    ...images.map((src) => imageReady(src, fast ? 2000 : 6000)),
  ];
  let target = 0;
  tasks.forEach((p) => p.finally(() => (target += 1 / tasks.length)));
  const speed = { v: 1 }; // the intro's fast-forward also hurries the count
  const progress: Progress = (minTime, onDone) => {
    const countEl = root.querySelector<HTMLElement>('[data-count]');
    const bar = root.querySelector<HTMLElement>('[data-loader-bar]');
    let last = performance.now();
    let clock = 0;
    let v = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = now - last;
      clock += elapsed * speed.v;
      last = now;
      const floor = Math.min(1, clock / minTime);
      const goal = Math.min(target, floor);
      // Keep progress equally quick on low-frame-rate devices.
      v += (goal - v) * (1 - Math.exp(-elapsed * speed.v / 170));
      if (goal >= 0.999 && v > 0.992) v = 1;
      countEl.textContent = String(Math.round(v * 100)).padStart(3, '0');
      bar.style.transform = `scaleX(${v})`;
      if (v === 1) { gsap.ticker.remove(tick); onDone(); }
    };
    gsap.ticker.add(tick);
  };

  return cinematic
    ? landing({ root, navSvg, navLogo, card, progress, speed })
    : curtain({ root, navSvg, navLogo, fast, progress });
}

// Resolves once the page is painting smoothly (two quick frames in a row), or after `max` ms
// whatever happens, so a drawing started then is seen from its very first line.
function framesFlowing(max = 1500) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    let last = 0;
    let smooth = 0;
    const step = (now) => {
      smooth = last && now - last < 50 ? smooth + 1 : 0;
      last = now;
      if (smooth >= 2 || now - t0 > max) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(resolve, max + 250); // (a hidden tab runs no frames at all)
  });
}

// arriving from another page of the site (not a reload): a short version
function arrivingInternally() {
  let internal = false;
  try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* no referrer */ }
  const navType = (performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined)?.type;
  return internal && navType !== 'reload';
}

// ─────────────────────────────────────────────────────────────────────────
// Home: the landing — the logo drawn on the hero's own dark, then the stage lighting up beneath it
// ─────────────────────────────────────────────────────────────────────────
type Progress = (minTime: number, onDone: () => void) => void;

function landing({ root, navSvg, navLogo, card, progress, speed }: { root: HTMLElement; navSvg: SVGSVGElement; navLogo: HTMLElement; card: HTMLElement; progress: Progress; speed: { v: number } }): Promise<void> {
  const brief = arrivingInternally();
  // the dark loader: count and company along the foot, "Skip intro" top right (src/styles/site/chrome.css)
  root.classList.add('is-cinematic', 'is-landing');
  const shutter = root.querySelector('[data-shutter]');
  const skip = root.querySelector('[data-intro-skip]');
  const nav = navLogo.closest<HTMLElement>('[data-nav]')!;
  const navItems = () => [...nav.querySelectorAll<HTMLElement>('.nav__links a, .nav__right > *')].filter((el) => el.offsetParent !== null);

  // the mark is the nav's own logo, cloned: the same leaves and the same lettering, in white
  const { svg, leaves, glyphs, line } = cloneMark(root, navSvg, 'arifa-leaf-intro');
  const rising = [...leaves].reverse(); // bottom leaf first, growing upward like the mark itself

  // everything the home page is about to show waits in the dark: the nav's links, and the
  // hero's stage (its light comes up under the logo as the logo leaves for the nav)
  gsap.set(navItems(), { opacity: 0 });
  // (opacity only: the hero's scale belongs to its own scroll effect, src/sections/home/hero.ts)
  gsap.set(card, { opacity: 0 });

  // 1 · the leaves come in one after another, bottom → middle → top: a bright green line
  //     runs round each leaf, then the leaf fills, dark at first, brightening to its full green,
  //     as its outline fades
  // 2 · the letters fade up one after another, ARIFA then PACK (starting as the top leaf fills)
  // 3 · "Opening the factory floor" rises from behind its edge
  gsap.set(leaves, { drawSVG: '0%', fillOpacity: 0, strokeOpacity: 1 });
  gsap.set(glyphs, { opacity: 0 });
  const mark = gsap.timeline({ paused: true })
    .to(rising, { drawSVG: '100%', duration: 0.38, ease: 'power1.inOut', stagger: 0.07 }, 0)
    .to(rising, { fillOpacity: 1, duration: 0.5, ease: 'power2.in', stagger: 0.13 }, 0.12)
    .to(rising, { strokeOpacity: 0, duration: 0.3, ease: 'power1.out', stagger: 0.12 }, 0.34)
    .to(glyphs, { opacity: 1, duration: 0.28, ease: 'power1.out', stagger: 0.05 }, 0.4)
    .to(line, { y: '0%', duration: 0.9, ease: 'expo.out' }, 0.85);
  if (brief) mark.progress(1);
  else {
    mark.to(skip, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.9);
    // The home page builds its 3D products while this plays, which can hold the main thread
    // for most of a second. Two things keep every leaf visibly arriving through that:
    // the drawing starts only once frames are flowing again, and while it runs a stalled frame
    // moves it on by no more than one frame (it waits, then carries on, never jumping ahead).
    // The site's own setting (none: src/motion/smoothScroll.ts) comes back in turn(), below.
    gsap.ticker.lagSmoothing(50, 1000 / 30);
    framesFlowing().then(() => gsap.delayedCall(0.15, () => mark.play()));
  }

  // any click, key or wheel fast-forwards; "Skip intro" finishes the mark at once
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  const hurry = () => {
    speed.v = Math.max(speed.v, 4);
    mark.timeScale(3);
  };
  const skipNow = () => {
    speed.v = 12;
    mark.progress(1);
  };
  events.forEach((e) => window.addEventListener(e, hurry, { passive: true }));
  skip.addEventListener('click', skipNow);

  return new Promise<void>((resolve) => {
    // the count runs to 100 while the mark draws, then holds a moment on the finished logo
    progress(brief ? 350 : 3000, () => (mark.progress() < 1
      ? mark.eventCallback('onComplete', turn)
      : turn()));

    function turn() {
      events.forEach((e) => window.removeEventListener(e, hurry));
      skip.removeEventListener('click', skipNow);
      mark.progress(1);
      gsap.ticker.lagSmoothing(0); // (the site's own setting, src/motion/smoothScroll.ts: set aside while the mark drew)
      // 1 · the line and the letters let go, left to right (ARIFA, then PACK)
      // 2 · the landing becomes the home page: its dark is the hero's own dark, so the ground
      //     never changes; the stage's light comes up beneath the leaves as they fly up into
      //     the nav (the clone shares the nav logo's viewBox, so it lands exactly on it, and
      //     the nav's own logo, lettering and all, fades in over it as it arrives)
      const to = navSvg.getBoundingClientRect();
      const from = svg.getBoundingClientRect();
      const s = to.width / from.width;
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      gsap.set(svg, { transformOrigin: '50% 50%' });
      const D = brief ? 0.15 : 0.45; // the letters' goodbye, before the leaves set off
      handoff.delay = 0.95; // the hero builds as its light comes up
      gsap.timeline()
        .to([line, skip], { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0)
        .to(glyphs, { opacity: 0, duration: 0.28, ease: 'power1.in', stagger: brief ? 0.015 : 0.05 }, brief ? 0 : 0.12)
        .to(shutter, { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, D)
        .to(card, { opacity: 1, duration: 1.7, ease: 'power2.inOut', clearProps: 'opacity' }, D + 0.1)
        .to(svg, { x: dx, y: dy, scale: s, duration: 1.35, ease: 'expo.inOut' }, D + 0.05)
        .add(() => {
          // (its own CSS fade would lag behind this one: hold it off while the mark hands over)
          navLogo.style.transition = 'none';
          navLogo.classList.add('is-in');
          gsap.fromTo(navLogo, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.out', clearProps: 'opacity,transition' });
        }, D + 1.05)
        .to(svg, { opacity: 0, duration: 0.35, ease: 'power1.in' }, D + 1.1)
        .add(() => {
          document.body.classList.remove('is-loading');
          resolve(); // hero.intro() starts here (src/sections/home/hero.ts)
        }, D + 0.3)
        .add(() => assembleNav(nav), D + 0.6)
        .add(() => root.remove(), D + 1.5);
    }
  });
}

// the nav's links drop into place from the outside in
function assembleNav(nav: HTMLElement) {
  const items = [...nav.querySelectorAll<HTMLElement>('.nav__links a, .nav__right > *')].filter((el) => el.offsetParent !== null);
  gsap.fromTo(items, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: { each: 0.08, from: 'edges' }, clearProps: 'transform,opacity' });
}

// ─────────────────────────────────────────────────────────────────────────
// The logo, drawn: the opening of every other page
// ─────────────────────────────────────────────────────────────────────────
// the loader draws the very same mark the nav uses: its leaves and its lettering, cloned
function cloneMark(root: HTMLElement, navSvg: SVGSVGElement | null, gradientId: string) {
  const brand = root.querySelector<HTMLElement>('[data-loader-brand]');
  const line = root.querySelector<HTMLElement>('.loader__line span');
  let svg: SVGSVGElement | null = null;
  if (navSvg) {
    svg = navSvg.cloneNode(true) as SVGSVGElement;
    svg.querySelector('linearGradient').id = gradientId;
    svg.querySelector('.logo-leaves').setAttribute('fill', `url(#${gradientId})`);
    brand.appendChild(svg);
  }
  const leaves = svg ? [...svg.querySelectorAll<SVGElement>('.leaf')] : [];
  const glyphs = svg ? [...svg.querySelectorAll<SVGElement>('.glyph')] : [];
  return { svg, leaves, glyphs, line, brand };
}

function drawMark(root: HTMLElement, navSvg: SVGSVGElement | null, fast: boolean) {
  const { svg, leaves, glyphs, line, brand } = cloneMark(root, navSvg, 'arifa-leaf-loader');
  gsap.set(svg, { transformOrigin: '50% 50%' });
  gsap.set(leaves, { drawSVG: '0%', fillOpacity: 0, strokeOpacity: 1 });
  gsap.set(glyphs, { opacity: 0, y: 36 });

  const tl = gsap.timeline({ delay: 0.15 })
    // bottom leaf first, growing upward like the mark itself
    .to([...leaves].reverse(), { drawSVG: '100%', duration: fast ? 0.01 : 1.15, ease: 'power2.inOut', stagger: 0.17 })
    .to([...leaves].reverse(), { fillOpacity: 1, duration: 0.8, ease: 'power1.out', stagger: 0.14 }, fast ? 0 : 0.7)
    .to(leaves, { strokeOpacity: 0, duration: 0.6, ease: 'power1.out' }, fast ? 0 : 1.15)
    .to(glyphs, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.05 }, fast ? 0 : 0.95)
    .to(line, { y: '0%', duration: 1, ease: 'expo.out' }, fast ? 0 : 1.35)
    // a single soft sheen across the leaves once they're complete
    .fromTo(svg, { filter: 'brightness(1)' }, { filter: 'brightness(1.12)', duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut' }, fast ? 0 : 1.9);
  return { svg, leaves, glyphs, line, brand, tl };
}



// ─────────────────────────────────────────────────────────────────────────
// Other pages: the curtain
// ─────────────────────────────────────────────────────────────────────────
function curtain({ root, navSvg, navLogo, fast, progress }: { root: HTMLElement; navSvg: SVGSVGElement | null; navLogo: HTMLElement | null; fast: boolean; progress: Progress }): Promise<void> {
  const shutter = root.querySelector('[data-shutter]');
  const foot = root.querySelector('.loader__foot');
  const { svg, glyphs, line, brand } = drawMark(root, navSvg, fast);

  // loader pieces that have a twin on this page, e.g. the progress line → a rule on the page
  const pairs = [...root.querySelectorAll<HTMLElement>('[data-handoff-from]')]
    .map((from) => ({ from, to: document.querySelector<HTMLElement>(`[data-handoff="${from.dataset.handoffFrom}"]`) }))
    .filter((p) => p.to);
  const twins = pairs.map((p) => p.to);
  gsap.set(twins, { opacity: 0 }); // hidden until their loader twin lands on them

  return new Promise<void>((resolve) => {
    progress(fast ? 550 : 2500, reveal); // let the mark finish drawing

    function reveal() {
      const tl = gsap.timeline({ onComplete: () => { navLogo?.classList.add('is-in'); root.remove(); } });
      // hand off only when the page's twins are actually on screen (not when arriving at /#contact)
      const handoff = pairs.length > 0 && !env.reduced && window.scrollY < innerHeight * 0.5;
      tl.to(svg, { scale: 0.94, duration: 0.45, ease: 'power2.inOut' }, 0) // breath in
        .add(() => {
          document.body.classList.remove('is-loading');
          resolve();
        }, 0.55);

      if (handoff) {
        const LAND = 0.62 + 1.25;
        const rect = (el) => el.getBoundingClientRect();
        // pieces with no twin on this page simply leave
        const loose = [...root.querySelectorAll<HTMLElement>('[data-handoff-from]')].filter((el) => !pairs.some((p) => p.from === el));
        tl.to([line, root.querySelector('.loader__count'), root.querySelector('.loader__lip'), ...loose], { opacity: 0, duration: 0.35, ease: 'power1.in' }, 0)
          .to(shutter, { backgroundColor: 'rgba(255,255,255,0)', duration: 0.7, ease: 'power1.inOut' }, 0.62);
        pairs.forEach(({ from, to }) => {
          // function values: measured on the tween's first frame, once the page layout is final
          tl.to(from, {
            x: () => rect(to).left - rect(from).left,
            y: () => rect(to).top - rect(from).top,
            color: () => getComputedStyle(to).color,
            duration: 1.25, ease: 'expo.inOut',
          }, 0.62);
        });
        tl.add(() => {
          gsap.set(twins, { opacity: 1 });
          gsap.set(pairs.map((p) => p.from), { opacity: 0 });
        }, LAND);
      } else {
        tl.to([line, foot], { opacity: 0, duration: 0.35, ease: 'power1.in' }, 0)
          .set(twins, { opacity: 1 }, 0.55)
          .to(shutter, { yPercent: -101, duration: 1.45, ease: 'expo.inOut' }, 0.62);
      }

      if (svg && navSvg) {
        // FLIP: measure where the nav logo sits and fly the mark onto it
        const to = navSvg.getBoundingClientRect();
        const from = svg.getBoundingClientRect();
        // measured before the timeline's first frame, so `from` is still at scale 1
        const s = to.width / from.width;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const ink = getComputedStyle(navSvg.querySelector('.glyph')).fill;
        tl.to(svg, { x: dx, y: dy, scale: s, duration: 1.4, ease: 'expo.inOut' }, 0.62)
          .to(glyphs, { fill: ink, duration: 0.7, ease: 'power1.inOut' }, 1.0);
      } else {
        tl.to(brand, { opacity: 0, duration: 0.5 }, 0.62);
      }
    }
  });
}
