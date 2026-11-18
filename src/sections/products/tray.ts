import gsap from 'gsap';
import { enquiry } from '@/lib/enquiry';
import { env } from '@/lib/env';
import { tc } from '@/i18n/client';

const esc = (s: unknown = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/*
  Floating enquiry tray. Shows once there's something in the list; the pill
  stacks the last three photos, the panel lists everything with remove buttons.
*/
export type Tray = { fly: (from: HTMLElement | null, src: string | null) => void; setOpen?: (v: boolean) => void };

export function initTray(): Tray {
  const root = document.querySelector<HTMLElement>('[data-tray]');
  if (!root) return { fly: () => {} };
  const pill = root.querySelector<HTMLElement>('[data-tray-toggle]');
  const panel = root.querySelector<HTMLElement>('[data-tray-panel]');
  const stack = root.querySelector<HTMLElement>('[data-tray-stack]');
  const count = root.querySelector<HTMLElement>('[data-tray-count]');
  const list = root.querySelector<HTMLElement>('[data-tray-list]');
  let open = false;
  let shown = false;

  const render = (items) => {
    count.textContent = items.length;
    stack.innerHTML = items.slice(-3).map((i) => (i.img ? `<img src="${i.img}" alt="" />` : '<span></span>')).join('');
    list.innerHTML = items
      .map((i) => `
        <li data-id="${i.id}">
          ${i.img ? `<img src="${i.img}" alt="" />` : '<span class="tray__ph"></span>'}
          <div><strong>${esc(i.ref)}</strong><small>${esc(i.name)}${i.code && i.code !== '—' ? ` · ${esc(i.code)}` : ''}</small></div>
          <button type="button" data-tray-remove aria-label="${esc(tc('Remove {ref}', { ref: i.ref }))}">✕</button>
        </li>`)
      .join('');
    const want = items.length > 0;
    if (want && !shown) {
      shown = true;
      root.hidden = false;
      gsap.fromTo(root, { yPercent: 160 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' });
    } else if (!want && shown) {
      shown = false;
      setOpen(false);
      gsap.to(root, { yPercent: 160, duration: 0.6, ease: 'expo.in', onComplete: () => (root.hidden = !shown) });
    }
  };

  const setOpen = (v) => {
    if (open === v) return;
    open = v;
    pill.setAttribute('aria-expanded', String(v));
    root.classList.toggle('is-open', v);
    gsap.killTweensOf(panel);
    if (v) {
      gsap.fromTo(panel, { clipPath: 'inset(100% 0% 0% 0% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', duration: 0.7, ease: 'expo.out' });
      gsap.fromTo(list.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.04, delay: 0.1 });
    } else {
      gsap.to(panel, { clipPath: 'inset(100% 0% 0% 0% round 8px)', duration: 0.45, ease: 'power3.in' });
    }
  };

  pill.addEventListener('click', () => setOpen(!open));
  document.addEventListener('pointerdown', (e) => open && !root.contains(e.target as Node) && setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
  list.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-tray-remove]');
    if (!b) return;
    const li = b.closest<HTMLElement>('li');
    gsap.to(li, { height: 0, opacity: 0, paddingBlock: 0, duration: 0.4, ease: 'power3.inOut', onComplete: () => enquiry.remove(li.dataset.id) });
  });
  root.querySelector<HTMLElement>('[data-tray-clear]').addEventListener('click', () => enquiry.clear());

  enquiry.subscribe(render);
  render(enquiry.list());

  // A photo leaves its card and arcs into the tray (x and y on different eases = a curve)
  function fly(fromEl, src) {
    const bump = () => {
      pill.classList.remove('is-bump');
      void pill.offsetWidth;
      pill.classList.add('is-bump');
    };
    if (!fromEl || !src || env.reduced) return setTimeout(bump, 50);
    requestAnimationFrame(() => {
      const a = fromEl.getBoundingClientRect();
      const b = pill.getBoundingClientRect();
      const img = document.createElement('img');
      img.className = 'fly';
      img.src = src;
      Object.assign(img.style, { width: `${a.width}px`, height: `${a.height}px` });
      document.body.appendChild(img);
      gsap.set(img, { x: a.left, y: a.top });
      // the tray may still be sliding in — aim for where it will rest
      const settling = ((Number(gsap.getProperty(root, 'yPercent')) || 0) / 100) * root.offsetHeight;
      const tx = b.left + 22 - a.width * 0.08;
      const ty = b.top - settling + b.height / 2 - a.height * 0.08;
      gsap.timeline({ onComplete: () => { img.remove(); bump(); } })
        .to(img, { x: tx, duration: 0.85, ease: 'power2.in' }, 0)
        .to(img, { y: ty, duration: 0.85, ease: 'back.in(1.6)' }, 0)
        .to(img, { scale: 0.16, borderRadius: '50%', transformOrigin: '0% 0%', duration: 0.85, ease: 'power3.in' }, 0)
        .to(img, { opacity: 0, duration: 0.15 }, 0.75);
    });
  }

  return { fly, setOpen };
}
