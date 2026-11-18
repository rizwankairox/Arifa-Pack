import gsap from 'gsap';
import { tc } from '@/i18n/client';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function initFilm(lenis) {
  const root = document.querySelector<HTMLElement>('[data-film]');
  if (!root) return;
  const video = root.querySelector<HTMLVideoElement>('[data-film-video]');
  const frame = root.querySelector<HTMLElement>('[data-film-frame]');
  const backdrop = root.querySelector<HTMLElement>('.film__backdrop');
  const closeBtn = root.querySelector<HTMLElement>('.film__close');
  const toggle = root.querySelector<HTMLElement>('[data-film-toggle]');
  const mute = root.querySelector<HTMLElement>('[data-film-mute]');
  const scrub = root.querySelector<HTMLElement>('[data-film-scrub]');
  const fill = root.querySelector<HTMLElement>('[data-film-fill]');
  const buffer = root.querySelector<HTMLElement>('[data-film-buffer]');
  const time = root.querySelector<HTMLElement>('[data-film-time]');
  const ticks = root.querySelector<HTMLElement>('[data-film-ticks]');
  const DURATION = 140.7;
  let lastFocus = null;
  let open = false;

  // chapter ticks from the "walk the floor" cards
  [...document.querySelectorAll<HTMLElement>('.chapter[data-t]')].forEach((c) => {
    const i = document.createElement('i');
    i.style.left = `${(Number(c.dataset.t) / DURATION) * 100}%`;
    i.title = c.querySelector<HTMLElement>('h3')?.textContent || '';
    ticks.appendChild(i);
  });

  const show = (t = 0) => {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    lenis?.stop();
    if (video.preload === 'none') video.preload = 'auto';
    const start = () => {
      video.currentTime = t;
      video.muted = false;
      video.play().catch(() => { video.muted = true; video.play().catch(() => {}); syncMute(); });
      syncMute();
    };
    if (video.readyState >= 1) start();
    else {
      video.addEventListener('loadedmetadata', start, { once: true });
      if (video.networkState !== HTMLMediaElement.NETWORK_LOADING) video.load();
    }
    gsap.timeline()
      .to(backdrop, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(frame, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'expo.inOut' }, 0.1)
      .fromTo('.film__bar', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.75)
      .to(closeBtn, { opacity: 1, duration: 0.4 }, 0.6);
    closeBtn.focus({ preventScroll: true });
  };

  const hide = () => {
    if (!open) return;
    open = false;
    video.pause();
    gsap.timeline({
      onComplete: () => {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
        lenis?.start();
        lastFocus?.focus?.({ preventScroll: true });
      },
    })
      .to([closeBtn, '.film__bar'], { opacity: 0, duration: 0.25 }, 0)
      .to(frame, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.7, ease: 'expo.inOut' }, 0)
      .to(backdrop, { opacity: 0, duration: 0.5 }, 0.35);
  };

  const syncMute = () => (mute.textContent = tc(video.muted ? 'Sound off' : 'Sound on'));

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-film-open]');
    if (trigger && !root.contains(trigger)) {
      e.preventDefault();
      show(Number(trigger.dataset.t || 0));
    }
    if ((e.target as Element).closest<HTMLElement>('[data-film-close]')) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === ' ' && document.activeElement !== toggle) { e.preventDefault(); toggle.click(); }
  });

  toggle.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  video.addEventListener('play', () => { root.classList.remove('is-paused'); toggle.setAttribute('aria-label', 'Pause'); });
  video.addEventListener('pause', () => { root.classList.add('is-paused'); toggle.setAttribute('aria-label', 'Play'); });
  video.addEventListener('click', () => toggle.click());
  mute.addEventListener('click', () => { video.muted = !video.muted; syncMute(); });

  video.addEventListener('timeupdate', () => {
    const d = video.duration || DURATION;
    fill.style.transform = `scaleX(${video.currentTime / d})`;
    time.textContent = fmt(video.currentTime);
  });
  video.addEventListener('progress', () => {
    if (!video.buffered.length) return;
    buffer.style.transform = `scaleX(${video.buffered.end(video.buffered.length - 1) / (video.duration || DURATION)})`;
  });

  // drag to seek
  const seek = (e) => {
    const r = scrub.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    video.currentTime = p * (video.duration || DURATION);
  };
  scrub.addEventListener('pointerdown', (e) => {
    scrub.setPointerCapture(e.pointerId);
    seek(e);
    const move = (ev) => seek(ev);
    scrub.addEventListener('pointermove', move);
    scrub.addEventListener('pointerup', () => scrub.removeEventListener('pointermove', move), { once: true });
  });
}
