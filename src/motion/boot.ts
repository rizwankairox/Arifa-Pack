/*
  Shared start-up for every page:
  smooth scroll → magnetic buttons → clock → menu → loader → the page's own setup → nav/footer → reveal.

  Each page's start file (src/sections/<page>/start.ts) calls boot({ init }). `init(lenis)` builds
  the page and may return { intro } — run once the loader's curtain has lifted.
*/
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import type Lenis from 'lenis';

import { env, fontsReady, tickMouse } from '@/lib/env';
import { initClock } from '@/lib/clock';
import { initScroll } from './smoothScroll';
import { initMagnetic } from './magnetic';
import { runLoader, type LoaderOptions } from './loader';
import { initNav, initMenu, initReveals, initFooter } from './siteChrome';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
gsap.config({ nullTargetWarn: false });

export type PageController = { intro?: () => void };

export type BootOptions = {
  /** builds the page; may return { intro } to play once the curtain lifts */
  init?: (lenis: Lenis) => PageController | void | Promise<PageController | void>;
  /** media the loader waits for before lifting (see motion/loader.ts) */
  loader?: LoaderOptions;
  keepScroll?: boolean;
};

export async function boot({ init, loader = {}, keepScroll = false }: BootOptions = {}) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!keepScroll) window.scrollTo(0, 0);
  if (env.reduced) document.documentElement.classList.add('reduced');

  const lenis = initScroll();
  lenis.stop();
  gsap.ticker.add(tickMouse);
  if (process.env.NODE_ENV === 'development') {
    // dev-only helpers for driving frames when the page runs in the background
    const pump = (ms = 1500) => {
      const end = performance.now() + ms;
      while (performance.now() < end) {
        const t = performance.now() + 16;
        while (performance.now() < t);
        gsap.ticker.tick();
      }
    };
    const go = (y: number, ms = 2400) => {
      lenis.scrollTo(y, { immediate: true });
      ScrollTrigger.update();
      pump(ms);
    };
    const at = (sel: string, p = 0) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      go(el.offsetTop + Math.max(0, el.offsetHeight - innerHeight) * p);
    };
    window.__arifa = { gsap, ScrollTrigger, lenis, pump, go, at };
  }

  initMagnetic();
  initClock();
  initMenu(lenis);

  const loaded = runLoader(loader);

  // anything that measures text waits for the real fonts
  await fontsReady;
  const page = (await init?.(lenis)) || {};
  initReveals();
  initFooter();
  // created last: its triggers must account for any pinned sections above them
  initNav(lenis);
  ScrollTrigger.refresh();
  // arriving from another page with a hash (e.g. /#contact): jump there once layout is final
  const target = location.hash.length > 1 && document.querySelector<HTMLElement>(location.hash);
  if (target) {
    lenis.resize(); // Lenis clamps to its last-measured height; pins have just grown the page
    lenis.scrollTo(target, { immediate: true, force: true });
  }

  await loaded;
  lenis.start();
  page.intro?.();
  return { lenis, page };
}
