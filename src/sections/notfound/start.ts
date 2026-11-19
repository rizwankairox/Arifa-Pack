// The "page not found" page (src/views/notfound.tsx). Runs in the browser once the page has loaded
// (src/motion/PageScripts.tsx): the header, menu and assistant work as on every other page.
import gsap from 'gsap';
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { env } from '@/lib/env';

export function start() {
  return boot({
    loader: { images: [] },
    init(lenis) {
      const assistant = initAssistant({ page: 'notfound', lenis });
      const parts = document.querySelectorAll<HTMLElement>('.nf__inner > *');
      if (!env.reduced) gsap.set(parts, { opacity: 0, y: 24 });
      return {
        intro() {
          if (!env.reduced) gsap.to(parts, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06, clearProps: 'transform' });
          assistant.arrive();
          assistant.start({ quiet: true });
        },
      };
    },
  });
}
