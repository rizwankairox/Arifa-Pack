// Products — the catalogue. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import gsap from 'gsap';
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

      // entrance, played when the curtain lifts: the family tiles' heading, then the tiles
      const head = document.querySelector<HTMLElement>('.fams__head');
      gsap.set(head, { opacity: 0, y: 20 });

      const params = new URLSearchParams(location.search);
      return {
        intro() {
          gsap.timeline()
            .to(head, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' }, 0.2)
            .add(() => families.enter(), 0.3);
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
