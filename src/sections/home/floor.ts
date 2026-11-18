import gsap from 'gsap';
import { autoVideo } from '@/lib/env';
import { isArPage } from '@/i18n/client';

export function initFloor() {
  const root = document.querySelector<HTMLElement>('[data-floor]');
  if (!root) return;
  const pin = root.querySelector<HTMLElement>('.floor__pin');
  const track = root.querySelector<HTMLElement>('[data-floor-track]');
  const bar = root.querySelector<HTMLElement>('[data-floor-bar]');
  const count = root.querySelector<HTMLElement>('[data-floor-count]');
  const chapters = [...track.children];
  const total = chapters.length;
  chapters.forEach((c) => autoVideo(c.querySelector<HTMLVideoElement>('video')));

  // English runs the chapters left to right (the track slides left); Arabic runs them right to
  // left, so the track starts at the right edge and slides right
  const rtl = isArPage();
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const tween = gsap.to(track, {
    x: () => (rtl ? dist() : -dist()),
    ease: 'none',
    scrollTrigger: {
      trigger: root,
      pin,
      start: 'top top',
      end: () => '+=' + dist(),
      scrub: 0.9,
      invalidateOnRefresh: true,
      onUpdate: (s) => {
        bar.style.transform = `scaleX(${s.progress})`;
        const i = Math.min(total, Math.floor(s.progress * total) + 1);
        count.textContent = `${String(i).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      },
    },
  });

  // each card's footage drifts against the track — depth without 3D
  chapters.forEach((c) => {
    const v = c.querySelector<HTMLVideoElement>('video');
    gsap.fromTo(v, { xPercent: rtl ? 5 : -5 }, {
      xPercent: rtl ? -5 : 5, ease: 'none',
      scrollTrigger: { trigger: c, containerAnimation: tween, start: rtl ? 'right left' : 'left right', end: rtl ? 'left right' : 'right left', scrub: true },
    });
    gsap.from(c, {
      y: 80, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: c, containerAnimation: tween, start: rtl ? 'right 5%' : 'left 95%' },
    });
  });
}
