'use client';
/*
  The bridge between React and the page's motion.

  React (the server) builds each page's HTML. Once it is in the browser, this loads that page's
  script — src/sections/<page>/start.ts — which starts the smooth scroll, the loader, the GSAP
  animations and the 3D scenes on top of that HTML.

  Each page loads its own script only, so the home page's 3D never ships to the contact page.
*/
import { useEffect } from 'react';
import type { PageName } from '@/assistant/types';

const scripts: Record<PageName, () => Promise<{ start: () => unknown }>> = {
  home: () => import('@/sections/home/start'),
  products: () => import('@/sections/products/start'),
  about: () => import('@/sections/about/start'),
  quality: () => import('@/sections/quality/start'),
  clients: () => import('@/sections/clients/start'),
  contact: () => import('@/sections/contact/start'),
};

// once per page load: moving between pages is a full page load (so the loader's curtain and the
// assistant can carry on from one page to the next, as in the approved prototype)
let started = false;

export function PageScripts({ page }: { page: PageName }) {
  useEffect(() => {
    if (started) return;
    started = true;
    scripts[page]()
      .then((m) => m.start())
      .catch((err) => {
        // never leave the visitor stuck behind the loader
        console.error(`Could not start the ${page} page's scripts.`, err);
        document.body.classList.remove('is-loading');
        document.querySelector('[data-loader]')?.remove();
      });
  }, [page]);
  return null;
}
