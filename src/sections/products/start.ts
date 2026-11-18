// Products — the catalogue. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { boot } from '@/motion/boot';
import { initFamilies } from '@/sections/products/families';
import { initCatalogue } from '@/sections/products/catalogueClient';
import { initQuickView } from '@/sections/products/quickViewClient';
import { initTray } from '@/sections/products/tray';
import { initAssistant } from '@/assistant/assistant';
import type { ClientCatalogue } from '@/data/types';

export function start() {
  // the catalogue, written into the page by the server (src/components/site/PageData.tsx)
  const data: ClientCatalogue = JSON.parse(document.getElementById('catalogue-data').textContent);
  return boot({
    loader: { images: data.products.filter((p) => p.img).slice(0, 6).map((p) => p.img) },
    init(lenis) {
      const tray = initTray();
      let catalogue;
      const qv = initQuickView({ data, lenis, tray, getList: () => catalogue?.visibleIds() || [] });
      catalogue = initCatalogue({ data, lenis, qv, tray });
      const families = initFamilies({ lenis });
      // the assistant carries on here if the home page sent you (filters, opens a product)
      const assistant = initAssistant({ page: 'products', lenis });

      // hero entrance, played when the curtain lifts
      const title = document.querySelector<HTMLElement>('[data-hero-title]');
      const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
      const meta = document.querySelectorAll<HTMLElement>('.cat-hero__eyebrow, .cat-hero__lede, .cat-stats > div, .fams__head');
      gsap.set(split.lines, { yPercent: 110 });
      gsap.set(meta, { opacity: 0, y: 20 });

      const params = new URLSearchParams(location.search);
      return {
        intro() {
          gsap.timeline()
            .to(split.lines, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12 }, 0.2)
            .to(meta, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0.55)
            .add(() => families.enter(), 0.45);
          document.querySelectorAll<HTMLElement>('.cat-stats dd').forEach((dd) => {
            const to = Number(dd.dataset.countTo);
            const o = { v: 0 };
            gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', delay: 0.6, onUpdate: () => { dd.textContent = String(Math.round(o.v)).padStart(2, '0'); } });
          });
          // arriving with a family filter (from home or the footer): go straight to the grid
          if (params.has('family') || params.has('q')) {
            const grid = document.getElementById('catalogue');
            lenis.scrollTo(grid, { offset: -10, duration: 1.4 });
          }
          // shared product link: /products?p=ac-83185-n
          if (params.has('p')) setTimeout(() => qv.open(params.get('p'), document.querySelector<HTMLImageElement>(`[data-product="${params.get('p')}"] .pcard__media img`)), 700);
          assistant.arrive();
        },
      };
    },
  });
}
