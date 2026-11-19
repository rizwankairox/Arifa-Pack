// A product's own page. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import gsap from 'gsap';
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { enquiry } from '@/lib/enquiry';
import { env } from '@/lib/env';
import { tc } from '@/i18n/client';

// "Add to enquiry list": the same list the catalogue and the enquiry desk use (src/lib/enquiry.ts)
function initEnquire() {
  const btn = document.querySelector<HTMLElement>('[data-pd-enquire]');
  const listed = document.querySelector<HTMLElement>('[data-pd-listed]');
  if (!btn) return;
  const d = btn.dataset;
  const item = { id: d.id, ref: d.ref, name: d.name, code: d.code, img: d.img || null, familyName: d.familyName };
  const label = btn.querySelector<HTMLElement>('.btn__text');
  const sync = () => {
    const on = enquiry.has(item.id);
    btn.setAttribute('aria-pressed', String(on));
    const text = tc(on ? 'Added — remove from list' : 'Add to enquiry list');
    label.textContent = text;
    label.dataset.text = text;
    if (listed) listed.hidden = !on;
  };
  btn.addEventListener('click', () => enquiry.toggle(item));
  enquiry.subscribe(sync);
  sync();
}

export function start() {
  const img = document.querySelector<HTMLImageElement>('.pd__media img');
  return boot({
    loader: { images: img ? [img.currentSrc || img.src] : [] },
    init(lenis) {
      initEnquire();
      const assistant = initAssistant({ page: 'product', lenis });
      const parts = document.querySelectorAll<HTMLElement>('.pd__crumbs, .pd__media, .pd__info > *');
      if (!env.reduced) gsap.set(parts, { opacity: 0, y: 24 });
      return {
        intro() {
          if (!env.reduced) gsap.to(parts, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05, clearProps: 'transform' });
          assistant.arrive();
          assistant.start({ quiet: true });
        },
      };
    },
  });
}
