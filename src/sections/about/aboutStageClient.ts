import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from '@/lib/env';
import { DotField } from '@/three/scenes/DotField';
import { getRenderer } from '@/three/renderers';

/*
  The About page's stage: one live field of dots, pinned behind three chapters,
  that re-forms as each chapter comes up —
    00 Arifa Pack      → the logo's three leaves
    01 Heritage        → 1997, in dots
    02 Core values     → six bright nodes, threaded to a hub
  A chapter rail on the right shows where you are. Without WebGL (or with reduced
  motion) the chapters read on their own over the dark ground.
*/
export function initAboutStage() {
  const root = document.querySelector<HTMLElement>('[data-ab-stage]');
  if (!root) return { intro() {} };
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-chapter]')];
  const rail = [...root.querySelectorAll<HTMLElement>('[data-rail]')];
  const leafPaths = [...document.querySelectorAll<HTMLElement>('[data-nav-logo] .leaf')].map((p) => p.getAttribute('d'));

  let field = null;
  if (env.webgl && leafPaths.length) {
    try {
      const renderer = getRenderer('aboutStage');
      if (!renderer) throw new Error('no WebGL renderer');
      field = new DotField(renderer, { count: env.small ? 6500 : env.lowPower ? 9000 : 12000 });
      field.u.uDrift.value = env.reduced ? 0 : 1.4;
      field.paused = env.reduced;
    } catch (err) {
      console.warn('About stage: no WebGL, chapters only.', err);
      field = null;
    }
  }
  if (!field) root.classList.add('no-gl');
  if (process.env.NODE_ENV === 'development') window.__about = { field };

  // where the shapes stand: to the right of the words on wide screens, above them on narrow ones
  const wide = () => field.w >= 900;
  const at = () => (wide() ? { x: field.w * 0.21, y: -field.h * 0.02 } : { x: 0, y: field.h * 0.23 });
  const shapes = [
    () => field.leaves(leafPaths, { size: wide() ? field.h * 0.6 : field.h * 0.27, off: at() }),
    () => field.text('1997', { maxW: wide() ? field.w * 0.34 : field.w * 0.78, maxH: wide() ? field.h * 0.36 : field.h * 0.16, off: at() }),
    () => field.constellation(6, { s: wide() ? Math.min(field.w * 0.32, field.h * 0.66) : Math.min(field.w * 0.66, field.h * 0.32), off: at() }),
  ];

  let current = -1;
  let ready = false;
  const go = (i) => {
    rail.forEach((r, k) => r.classList.toggle('is-active', k === i));
    if (i === current) return;
    current = i;
    if (!field || !ready) return;
    if (env.reduced) field.set(shapes[i]());
    else field.morph(shapes[i], { duration: 1.9, spread: 0.5, swirl: 150 });
  };
  chapters.forEach((ch, i) => {
    ScrollTrigger.create({ trigger: ch, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => { if (s.isActive) go(i); } });
  });

  // draw only while the stage is on screen
  ScrollTrigger.create({
    trigger: root, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { if (field) (s.isActive ? field.start() : field.stop()); },
  });
  // the chapter rail shows only while you're in the chapters
  const railEl = root.querySelector<HTMLElement>('[data-ab-rail]');
  ScrollTrigger.create({
    trigger: root, start: 'top top', end: 'bottom 60%',
    onToggle: (s) => railEl?.classList.toggle('is-on', s.isActive),
  });

  // a resize re-forms the current shape where it now belongs
  if (field) field.onResize = () => { if (ready && current >= 0) field.set(shapes[current]()); };

  // ── the entrance: dust gathers into the leaves; the headline rises ──
  const lines = root.querySelectorAll<HTMLElement>('.ab-hero .ab-line > span');
  const reveals = root.querySelectorAll<HTMLElement>('.ab-hero .ab-reveal, .ab-hero .ab-cue');
  if (!env.reduced) {
    gsap.set(lines, { yPercent: 112 });
    gsap.set(reveals, { opacity: 0, y: 14 });
  }
  function intro() {
    ready = true;
    const first = current < 0 ? 0 : current;
    current = first;
    rail.forEach((r, k) => r.classList.toggle('is-active', k === first));
    if (env.reduced) {
      if (field) { field.set(shapes[first]()); field.u.uAlpha.value = 1; field.start(); }
      return;
    }
    const tl = gsap.timeline();
    if (field) {
      field.set(field.dust());
      field.u.uDrift.value = 14;
      field.start();
      tl.fromTo(field.u.uAlpha, { value: 0 }, { value: 1, duration: 1.2, ease: 'power1.out' }, 0)
        .add(field.morph(shapes[first], { duration: 2.4, spread: 0.55, swirl: 170 }), 0.3)
        .to(field.u.uDrift, { value: 1.4, duration: 2, ease: 'power2.out' }, 0.3);
    }
    tl.to(lines, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1 }, 0.2)
      .to(reveals, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0.55);
  }

  return { intro };
}
