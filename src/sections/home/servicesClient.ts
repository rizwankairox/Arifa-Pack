// Home · "What we do": an accordion of services, each with its own footage.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { autoVideo } from '@/lib/env';

// ── Services accordion ──
export function initServices() {
  const heads = [...document.querySelectorAll<HTMLElement>('.svc__head')];
  document.querySelectorAll<HTMLVideoElement>('.svc__media video').forEach(autoVideo);
  heads.forEach((h) => h.addEventListener('click', () => {
    const wasOpen = h.getAttribute('aria-expanded') === 'true';
    heads.forEach((o) => o.setAttribute('aria-expanded', 'false'));
    h.setAttribute('aria-expanded', String(!wasOpen));
    setTimeout(() => ScrollTrigger.refresh(), 850);
  }));
}

