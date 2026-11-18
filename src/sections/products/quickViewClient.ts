import gsap from 'gsap';
import { enquiry } from '@/lib/enquiry';
import { env } from '@/lib/env';
import type Lenis from 'lenis';
import type { ClientCatalogue } from '@/data/types';
import type { Tray } from './tray';
import { tc } from '@/i18n/client';

const esc = (s: unknown = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/*
  Quick view. The card's photo travels into the panel (shared-element FLIP)
  while the panel wipes open from the right. The whole photograph is shown, crisp,
  across the stage, on a ground of its own background colour (read off the photo's
  border). ←/→ walk the current filtered list.
*/
export type QuickView = ReturnType<typeof initQuickView>;

export function initQuickView({ data, lenis, tray, getList }: { data: ClientCatalogue; lenis: Lenis; tray: Tray; getList: () => string[] }) {
  const root = document.querySelector<HTMLElement>('[data-qv]');
  const panel = root.querySelector<HTMLElement>('[data-qv-panel]');
  const backdrop = root.querySelector<HTMLElement>('.qv__backdrop');
  const stage = root.querySelector<HTMLElement>('[data-qv-stage]');
  const img = root.querySelector<HTMLImageElement>('[data-qv-img]');
  const pending = root.querySelector<HTMLElement>('[data-qv-pending]');
  const $ = (s: string) => root.querySelector<HTMLElement>(s);
  const byId = new Map(data.products.map((p) => [p.id, p]));
  const enquireBtn = $('[data-qv-enquire]');
  const anim = () => [$('[data-qv-family]'), $('.qv__headline'), $('[data-qv-spec]'), $('.qv__actions'), $('.qv__note')];

  let current = null;
  let isOpen = false;
  let lastFocus = null;
  const mobile = () => matchMedia('(max-width: 600px)').matches;

  function fill(p) {
    current = p;
    $('[data-qv-family]').textContent = p.familyName;
    $('[data-qv-ref]').textContent = p.ref;
    $('[data-qv-title]').textContent = p.name;
    $('[data-qv-tag]').hidden = p.range !== 'self';
    const rows = [
      [tc('Product'), `${p.ref} ${p.name}`],
      [tc('Catalogue code'), p.code && p.code !== '—' ? p.code : tc('On request')],
      [tc('Packing'), p.qty || tc('On request')],
      [tc('Family'), p.familyName],
      [tc('Range'), tc(p.range === 'self' ? 'Arifa self range (retail pack)' : 'Trade')],
    ];
    $('[data-qv-spec]').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    const live = $('[data-qv-live]') as HTMLAnchorElement;
    live.href = p.live;
    if (p.img) {
      img.src = p.img;
      img.alt = `${p.ref} ${p.name}`;
      img.hidden = false;
      pending.hidden = true;
      setGround(p.img);
    } else {
      img.hidden = true;
      pending.hidden = false;
      stage.style.backgroundColor = '';
      $('[data-qv-pending-ref]').textContent = p.ref;
    }
    syncEnquire();
    const list = getList();
    const i = list.indexOf(p.id);
    $('[data-qv-pos]').textContent = i >= 0 ? `${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}` : '';
    const u = new URL(location.href);
    u.searchParams.set('p', p.id);
    history.replaceState(null, '', u);
  }

  function syncEnquire() {
    if (!current) return;
    const on = enquiry.has(current.id);
    enquireBtn.setAttribute('aria-pressed', String(on));
    const label = tc(on ? 'Added — remove from list' : 'Add to enquiry list');
    const t = enquireBtn.querySelector<HTMLElement>('.btn__text');
    t.textContent = label;
    t.dataset.text = label;
  }
  enquiry.subscribe(syncEnquire);

  // The ground behind a photograph: the colour of its own background, read off its border.
  // (A trimmed mean by brightness, so a product that runs to the edge doesn't tint it.)
  const grounds = new Map();
  function setGround(src) {
    if (grounds.has(src)) { stage.style.backgroundColor = grounds.get(src); return; }
    const probe = new Image();
    probe.src = src;
    probe.decode().then(() => {
      const W = 64, H = Math.max(8, Math.round((W * probe.naturalHeight) / probe.naturalWidth));
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(probe, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H).data;
      const px = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x > 1 && x < W - 2 && y > 1 && y < H - 2) continue; // (the outer two rows only)
          const i = (y * W + x) * 4;
          px.push([d[i], d[i + 1], d[i + 2], d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11]);
        }
      }
      px.sort((a, b) => a[3] - b[3]);
      const mid = px.slice(Math.floor(px.length * 0.25), Math.ceil(px.length * 0.75));
      const avg = (k) => Math.round(mid.reduce((t, c) => t + c[k], 0) / mid.length);
      const col = `rgb(${avg(0)}, ${avg(1)}, ${avg(2)})`;
      grounds.set(src, col);
      if (current?.img === src) stage.style.backgroundColor = col;
    }).catch(() => { /* keep the neutral ground */ });
  }

  // where the stage draws the photo: the full width of the stage (or its full height, if the
  // stage is the wider shape), centred
  function photoRect(src) {
    const r = stage.getBoundingClientRect();
    const iw = src.naturalWidth || 720, ih = src.naturalHeight || 474;
    const k = Math.min(r.width / iw, r.height / ih);
    const w = iw * k, h = ih * k;
    return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
  }

  function open(id, fromImg) {
    const p = byId.get(id);
    if (!p) return;
    lastFocus = document.activeElement;
    fill(p);
    isOpen = true;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    lenis?.stop();

    const closed = mobile() ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 100% round 6px)';
    const shown = mobile() ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 0% 0% round 6px)';
    const tl = gsap.timeline();
    tl.to(backdrop, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(panel, { clipPath: closed }, { clipPath: shown, duration: env.reduced ? 0.01 : 0.95, ease: 'expo.inOut' }, 0)
      .fromTo(anim(), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.45);

    // shared element: the card photo travels into the stage
    if (fromImg && p.img && !env.reduced) {
      const a = fromImg.getBoundingClientRect();
      const b = photoRect(fromImg);
      const ghost = document.createElement('img');
      ghost.src = p.img;
      ghost.className = 'fly';
      Object.assign(ghost.style, { width: `${a.width}px`, height: `${a.height}px`, zIndex: 96, borderRadius: '11px', boxShadow: 'none' });
      document.body.appendChild(ghost);
      gsap.set(img, { opacity: 0 });
      gsap.set(ghost, { x: a.left, y: a.top });
      tl.to(ghost, { x: b.left, y: b.top, width: b.width, height: b.height, borderRadius: 6, duration: 0.95, ease: 'expo.inOut' }, 0)
        .add(() => gsap.set(img, { opacity: 1 }))
        .to(ghost, { opacity: 0, duration: 0.3, ease: 'power1.out', onComplete: () => ghost.remove() });
    } else {
      gsap.fromTo(img, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out', delay: 0.2 });
    }
    setTimeout(() => $('[data-qv-close].qv__close').focus({ preventScroll: true }), 400);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const closed = mobile() ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 100% round 6px)';
    gsap.timeline({
      onComplete: () => {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
        lenis?.start();
        lastFocus?.focus?.({ preventScroll: true });
      },
    })
      .to(anim(), { y: -16, opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.02 }, 0)
      .to(panel, { clipPath: closed, duration: 0.7, ease: 'expo.inOut' }, 0.1)
      .to(backdrop, { opacity: 0, duration: 0.5 }, 0.3);
    const u = new URL(location.href);
    u.searchParams.delete('p');
    history.replaceState(null, '', u);
  }

  function step(dir) {
    const list = getList();
    if (!current || !list.length) return;
    const i = list.indexOf(current.id);
    const next = byId.get(list[(i + dir + list.length) % list.length]);
    gsap.timeline()
      .to([img, pending], { xPercent: -8 * dir, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0)
      .to(anim(), { opacity: 0, y: -10, duration: 0.2, stagger: 0.02 }, 0)
      .add(() => fill(next))
      .fromTo([img, pending], { xPercent: 8 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' })
      .fromTo(anim(), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, '<');
  }

  root.addEventListener('click', (e) => {
    if ((e.target as Element).closest<HTMLElement>('[data-qv-close]')) close();
    if ((e.target as Element).closest<HTMLElement>('[data-qv-prev]')) step(-1);
    if ((e.target as Element).closest<HTMLElement>('[data-qv-next]')) step(1);
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  enquireBtn.addEventListener('click', () => {
    if (!current) return;
    const added = enquiry.toggle(current);
    if (added) tray.fly(img.hidden ? pending : img, current.img);
  });

  return { open, close, isOpen: () => isOpen };
}
