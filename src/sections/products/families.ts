import gsap from 'gsap';
import { env } from '@/lib/env';

/*
  Browse by family: the eight families as one dark band of panels on their own factory footage.
  A panel filters the catalogue below to its family (through the family's own chip, so the bar,
  the URL and the assistant all agree) and glides down to it. Without JavaScript each tile is
  simply a link to that family's listing.
*/
export function initFamilies({ lenis }) {
  const root = document.querySelector<HTMLElement>('[data-fams]');
  if (!root) return { enter() {} };
  const tiles = [...root.querySelectorAll<HTMLElement>('.fam')];
  const toGrid = () => lenis.scrollTo('#catalogue', { offset: -10, duration: 1.3 });
  const filter = (id) => {
    const chip = document.querySelector<HTMLElement>(`.cat-chip[data-family="${id}"]`);
    if (chip && !chip.classList.contains('is-active')) chip.click();
    toGrid();
  };
  const plain = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0);

  tiles.forEach((t) => t.addEventListener('click', (e) => {
    if (!plain(e)) return; // (a new tab still gets the family's own listing)
    e.preventDefault();
    filter(t.dataset.fam);
  }));
  root.querySelector<HTMLElement>('[data-fams-all]')?.addEventListener('click', (e) => {
    if (!plain(e)) return;
    e.preventDefault();
    filter('all');
  });

  // a panel's film plays only while it is open (hovered, or focused from the keyboard); its
  // poster stands in the rest of the time, so the page never runs eight films at once
  if (!env.reduced) {
    tiles.forEach((t) => {
      const v = t.querySelector<HTMLVideoElement>('video');
      if (!v) return;
      const play = () => {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      };
      const stop = () => v.pause();
      t.addEventListener('pointerenter', play);
      t.addEventListener('focus', play);
      t.addEventListener('pointerleave', stop);
      t.addEventListener('blur', stop);
    });
  }

  // they come up one after another as the page opens (products.js → intro)
  if (!env.reduced) gsap.set(tiles, { opacity: 0, y: 26 });
  return {
    enter() {
      if (env.reduced) return;
      gsap.to(tiles, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.055, clearProps: 'transform,opacity' });
    },
  };
}
