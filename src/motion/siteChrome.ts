/*
  Site-wide behaviour shared by every page: the nav, the full-screen menu, heading reveals and
  the footer wordmark. (Markup: src/components/site/Nav.tsx, Menu.tsx, Footer.tsx.)
*/
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';
import { env } from '@/lib/env';
import { isArPage } from '@/i18n/client';
import { enquiry } from '@/lib/enquiry';

// ── Nav: colour follows the section under it, hides while reading down ──
export function initNav(lenis: Lenis) {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  // the EN ⇄ عربي switch keeps the visitor's place: filters (?family=…) and section (#…) carry over
  document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((a) => {
    const u = new URL(a.href, location.href);
    a.href = u.pathname + location.search + location.hash;
  });
  document.querySelectorAll<HTMLElement>('main > [data-theme], footer[data-theme]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 38px', end: 'bottom 38px',
      onToggle: (s) => {
        if (!s.isActive) return;
        // a section can ask for the nav it sits under (the home hero is a dark card on paper)
        nav.classList.toggle('is-light', (sec.dataset.navTheme || sec.dataset.theme) === 'light');
        nav.classList.toggle('is-white', sec.dataset.surface === 'white'); // the white home hero
      },
    });
  });
  lenis.on('scroll', ({ scroll, direction }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    const hide = direction === 1 && scroll > innerHeight * 0.9 && !document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', hide);
  });
}

// ── Full-screen menu ──
export function initMenu(lenis: Lenis) {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
  const panel = menu.querySelector<HTMLElement>('[data-menu-panel]');
  const labels = menu.querySelectorAll<HTMLElement>('.menu__label, .menu__num');
  const aside = menu.querySelectorAll<HTMLElement>('.menu__aside, .menu__enquiry');
  const video = menu.querySelector<HTMLVideoElement>('[data-menu-video]');
  let open = false;
  let tl;

  const set = (v: boolean) => {
    open = v;
    toggle.setAttribute('aria-expanded', String(v));
    menu.setAttribute('aria-hidden', String(!v));
    document.body.classList.toggle('menu-open', v);
    tl?.kill();
    if (v) {
      menu.classList.add('is-open');
      lenis.stop();
      video?.play().catch(() => {});
      tl = gsap.timeline()
        .fromTo(panel, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(labels, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.04 }, 0.45)
        .fromTo(aside, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 0.55);
    } else {
      lenis.start();
      tl = gsap.timeline({ onComplete: () => { menu.classList.remove('is-open'); video?.pause(); } })
        .to(labels, { yPercent: -110, duration: 0.45, ease: 'power3.in', stagger: 0.02 })
        .to(panel, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' }, 0.2);
    }
  };
  toggle.addEventListener('click', () => set(!open));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && open && set(false));

  // the enquiry list, on every page: a way through to the quote once something is picked
  const cart = menu.querySelector<HTMLElement>('[data-menu-enquiry]');
  const cartCount = menu.querySelector<HTMLElement>('[data-menu-enquiry-count]');
  const showCart = (items) => {
    if (!cart) return;
    cart.hidden = items.length === 0;
    cartCount.textContent = String(items.length);
  };
  enquiry.subscribe(showCart);
  showCart(enquiry.list());
  document.addEventListener('nav:go', () => open && set(false));
}

// ── "Skip" on the long scroll scenes: glide straight past the rest of the scene ──
export function initSkipScenes(lenis: Lenis) {
  document.querySelectorAll<HTMLElement>('[data-skip-scene]').forEach((b) => {
    const scene = b.closest<HTMLElement>('section');
    if (!scene) return;
    b.addEventListener('click', () => {
      // where the next section starts (it may tuck up under the scene's last screen, as the
      // product range does under the press on Home)
      const next = scene.nextElementSibling as HTMLElement | null;
      const end = (next ? next.getBoundingClientRect().top : scene.getBoundingClientRect().bottom) + window.scrollY;
      lenis.scrollTo(end, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
    });
  });
}

// ── Line-masked heading reveals ──
export function initReveals() {
  document.querySelectorAll<HTMLElement>('[data-split-lines]').forEach((el) => {
    const s = SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => {
        // each line's mask gets room below the baseline (.split-mask), so descenders, and Arabic
        // letters that reach further down, aren't cut off
        self.masks?.forEach((m) => m.classList.add('split-mask'));
        return gsap.from(self.lines, {
          yPercent: 140, duration: 1.3, ease: 'expo.out', stagger: 0.08, // (fully below the mask's extra room)
          scrollTrigger: { trigger: el, start: 'top 86%' },
        });
      },
    });
    void s;
  });
  // the labels slide in from the side the line starts on (the right in Arabic), so they never
  // poke out past the edge of a phone screen
  const from = isArPage() ? 16 : -16;
  gsap.utils.toArray<HTMLElement>('.eyebrow').forEach((el) => {
    if (el.closest<HTMLElement>('.hero, .line')) return;
    gsap.from(el, { opacity: 0, x: from, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  gsap.utils.toArray<HTMLElement>('.person').forEach((p, i) => {
    const img = p.querySelector<HTMLElement>('.person__img');
    gsap.fromTo(img, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: i * 0.08,
      scrollTrigger: { trigger: p, start: 'top 85%' },
    });
  });
}

// ── Footer wordmark: letters breathe toward the cursor (variable width + weight) ──
export function initFooter() {
  const mark = document.querySelector<HTMLElement>('[data-foot-mark]');
  if (!mark) return;
  const chars = [];
  mark.querySelectorAll<HTMLElement>('span').forEach((s) => {
    const txt = s.textContent;
    s.textContent = '';
    [...txt].forEach((c) => {
      const ch = document.createElement('span');
      ch.className = 'foot__ch';
      ch.textContent = c;
      s.appendChild(ch);
      chars.push(ch);
    });
  });
  gsap.from(chars, {
    yPercent: 100, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.04,
    scrollTrigger: { trigger: mark, start: 'top 95%' },
  });
  gsap.from(mark.querySelector<HTMLImageElement>('img'), {
    scale: 0, rotate: -40, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: mark, start: 'top 95%' },
  });
  if (!env.fine) return;
  const setters = chars.map((c) => ({
    el: c,
    w: gsap.quickTo(c, '--w', { duration: 0.8, ease: 'power3' }),
    g: gsap.quickTo(c, '--g', { duration: 0.8, ease: 'power3' }),
  }));
  chars.forEach((c) => { c.style.setProperty('--w', 72); c.style.setProperty('--g', 500); });
  mark.addEventListener('pointermove', (e) => {
    setters.forEach(({ el, w, g }) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2)) / innerWidth;
      const k = Math.max(0, 1 - d * 3.2);
      // (a gentle swell: wide enough to feel, never so wide or heavy that neighbours touch)
      w(66 + k * 22);
      g(380 + k * 340);
    });
  });
  mark.addEventListener('pointerleave', () => setters.forEach(({ w, g }) => { w(72); g(500); }));
}
