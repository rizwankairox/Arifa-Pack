// About — the company. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { autoVideo, env } from '@/lib/env';
import { initAboutStage } from '@/sections/about/aboutStageClient';
import { initAboutReach } from '@/sections/about/aboutReach';
import { whenRenderer } from '@/three/renderers';

export function start() {
  return boot({
    async init(lenis) {
      await whenRenderer('aboutStage');
      const stage = initAboutStage();
      initAboutReach();
      const assistant = initAssistant({ page: 'about', lenis });

      // footage plays only while it's on screen
      document.querySelectorAll<HTMLVideoElement>('.ab-card video, .ab-visit__film').forEach(autoVideo);

      if (!env.reduced) {
        // words that light up as you read them
        document.querySelectorAll<HTMLElement>('[data-ab-scrub]').forEach((el) => {
          const { words } = SplitText.create(el, { type: 'words' });
          gsap.fromTo(words, { opacity: 0.16 }, {
            opacity: 1, ease: 'none', stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true },
          });
        });

        // the six values come on one after another as the chapter scrolls by
        const values = document.querySelectorAll<HTMLElement>('[data-ab-values] li');
        if (values.length) {
          gsap.fromTo(values, { opacity: 0.18, x: -10 }, {
            opacity: 1, x: 0, ease: 'none', stagger: 0.5,
            scrollTrigger: { trigger: '[data-ab-values]', start: 'top 78%', end: 'bottom 52%', scrub: true },
          });
        }

        // cards, portraits and panels rise into place
        const rise = (sel: string, opts: { step?: number; every?: number } = {}) => document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
          gsap.from(el, {
            y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', delay: (opts.step || 0) * (i % (opts.every || 1)),
            scrollTrigger: { trigger: el, start: 'top 88%' },
          });
        });
        rise('.ab-ceo__card');
        // the portrait settles from a slow push-in as the card comes up
        const ceoImg = document.querySelector<HTMLElement>('[data-ab-ceo-img]');
        if (ceoImg) {
          gsap.fromTo(ceoImg, { scale: 1.16 }, {
            scale: 1, ease: 'none',
            scrollTrigger: { trigger: '.ab-ceo__card', start: 'top bottom', end: 'center 55%', scrub: true },
          });
        }
        rise('.ab-person', { step: 0.1, every: 3 });
        rise('.ab-card', { step: 0.08, every: 4 });
        rise('.ab-visit .ab-glass', { step: 0.1, every: 3 });

        // the visit film drifts slower than the page
        const film = document.querySelector<HTMLElement>('.ab-visit__film');
        if (film) {
          gsap.fromTo(film, { yPercent: -8 }, {
            yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: '.ab-visit', start: 'top bottom', end: 'bottom top', scrub: true },
          });
        }
      }

      ScrollTrigger.refresh();
      return {
        intro() {
          stage.intro();
          assistant.arrive();
          assistant.start({ quiet: true });
        },
      };
    },
  });
}
