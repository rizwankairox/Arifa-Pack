import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, mouse } from '@/lib/env';
import { RangeReveal } from '@/three/scenes/RangeReveal';
import { getRenderer } from '@/three/renderers';

export function initRange() {
  const root = document.querySelector<HTMLElement>('[data-range]');
  if (!root) return;
  const list = root.querySelector<HTMLElement>('[data-range-list]');
  const items = [...list.querySelectorAll<HTMLElement>('.range__item')];
  const canvas = root.querySelector<HTMLElement>('[data-range-gl]');

  // rows rise in one after another
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07 }),
  });

  if (!env.fine || !env.webgl) {
    canvas.remove();
    return;
  }

  let rv;
  try {
    const renderer = getRenderer('range');
    if (!renderer) throw new Error('no WebGL renderer');
    rv = new RangeReveal(renderer, items);
  } catch (err) {
    console.warn('Range WebGL unavailable.', err);
    canvas.remove();
    return;
  }

  if (process.env.NODE_ENV === 'development') window.__range = rv;
  let visible = false;
  ScrollTrigger.create({
    trigger: root, start: 'top 150%', once: true, onEnter: () => rv.preload(),
  });
  ScrollTrigger.create({
    trigger: list, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { visible = s.isActive; if (!visible) rv.hide(); },
  });
  items.forEach((it) => it.addEventListener('pointerenter', () => rv.show(it)));
  list.addEventListener('pointerleave', () => rv.hide());
  // Scrolling slides the rows under a pointer that hasn't moved, and the browser sends no
  // enter or leave for that: as the page moves, look at what's under the pointer instead,
  // so the plate follows the row it's over and lets go once it's off the list.
  let pointed = false; // (until the pointer has moved, its position is only a guess)
  window.addEventListener('pointermove', () => { pointed = true; }, { once: true, passive: true });
  window.addEventListener('scroll', () => {
    if (!pointed || (!visible && !rv.active)) return;
    const it = document.elementFromPoint(mouse.x, mouse.y)?.closest<HTMLElement>('.range__item');
    if (it && items.includes(it)) rv.show(it);
    else rv.hide();
  }, { passive: true });
  // (drawn on until it has faded right out: the canvas sits fixed over the whole page, so a
  // frame left on it would stay there over the sections below)
  gsap.ticker.add((t) => (visible || rv.needsFrame) && rv.render(t));
  window.addEventListener('resize', () => rv.resize());
}
