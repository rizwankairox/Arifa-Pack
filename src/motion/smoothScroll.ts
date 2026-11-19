import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { env } from '@/lib/env';

gsap.registerPlugin(ScrollTrigger);

export function initScroll(): Lenis {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !env.reduced,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.4,
    allowNestedScroll: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // links into this same page glide instead of jumping ("#x", "/#x", "/" on home)
  const norm = (p: string) => p.replace(/\/index\.html$/, '/');
  const glide = { duration: 1.8, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    // (a link whose own handler already dealt with the click, e.g. a family tile that filters in place)
    if (!a || e.defaultPrevented || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || norm(url.pathname) !== norm(location.pathname) || url.search !== location.search) return;
    const target = url.hash.length > 1 ? document.querySelector<HTMLElement>(url.hash) : url.hash === '' && a.getAttribute('href') !== '' ? 0 : null;
    if (target === null) return;
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('nav:go'));
    lenis.scrollTo(target, glide);
  });
  return lenis;
}
