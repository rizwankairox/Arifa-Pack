// The home page's product list: its rows rise in one after another as it scrolls into view.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initRange() {
  const root = document.querySelector<HTMLElement>('[data-range]');
  if (!root) return;
  const items = [...root.querySelectorAll<HTMLElement>('.range__item')];
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07 }),
  });
}
