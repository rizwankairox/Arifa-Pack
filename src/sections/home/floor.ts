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

  const setProgress = (p: number) => {
    bar.style.transform = `scaleX(${p})`;
    const i = Math.min(total, Math.floor(p * total) + 1);
    count.textContent = `${String(i).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  };

  // English runs the chapters left to right (the track slides left); Arabic runs them right to
  // left, so the track starts at the right edge and slides right
  const rtl = isArPage();
  const mm = gsap.matchMedia();

  // big screens with a mouse: the section pins and the page scroll walks the track sideways
  mm.add('(min-width: 1025px) and (hover: hover) and (pointer: fine)', () => {
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
        onUpdate: (s) => setProgress(s.progress),
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
  });

  // phones, tablets and touch screens: no pin, so the page keeps scrolling down normally; the
  // chapters sit in a strip you swipe sideways, and the bar follows the swipe
  mm.add('not ((min-width: 1025px) and (hover: hover) and (pointer: fine))', () => {
    root.classList.add('floor--swipe');
    track.tabIndex = 0; // a scrolling strip must be reachable from the keyboard too
    const onScroll = () => {
      const max = track.scrollWidth - track.clientWidth;
      setProgress(max > 0 ? Math.min(1, Math.abs(track.scrollLeft) / max) : 1);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      track.removeEventListener('scroll', onScroll);
      root.classList.remove('floor--swipe');
      track.removeAttribute('tabindex');
    };
  });
}
