// The site uses the system's own pointer; this is only the magnetic pull of the round buttons.
import gsap from 'gsap';
import { env } from '@/lib/env';

export function initMagnetic() {
  if (!env.fine) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.36);
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)', overwrite: true });
    });
  });
}
