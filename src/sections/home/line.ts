import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, autoVideo } from '@/lib/env';
import { whenRenderer } from '@/three/renderers';

/*
  The line: one press, one shot (src/three/scenes/PressScene.ts), scrubbed by scroll.
  The ram strikes, the container is drawn, lifted out and closed with its embossed
  lid; the camera settles over the lid, and the frame melts away into the paper of
  the range below. Three short captions follow the shot.
*/
export function initLine() {
  const root = document.querySelector<HTMLElement>('[data-line]');
  if (!root) return;
  const canvas = root.querySelector<HTMLElement>('[data-line-gl]');
  const ui = root.querySelector<HTMLElement>('[data-line-ui]');
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step-at]')];
  const stepEl = root.querySelector<HTMLElement>('[data-line-step]');
  const bar = root.querySelector<HTMLElement>('[data-line-bar]');
  // the shot melts away into the next section's own ground (and the nav reads on it if it's light)
  const next = root.nextElementSibling;
  const paper = (next && getComputedStyle(next).backgroundColor) || '#08090b';
  const nextIsLight = (next as HTMLElement | null)?.dataset.theme === 'light';

  let scene = null;
  let progress = 0;
  let visible = false;

  const fallback = () => {
    root.classList.add('no-line-gl');
    const film = root.querySelector<HTMLVideoElement>('[data-line-film]');
    if (film) autoVideo(film);
  };

  let building = null;
  const build = () => {
    if (building) return building;
    if (!env.webgl) { fallback(); return (building = Promise.resolve()); }
    building = Promise.all([import('@/three/scenes/PressScene'), whenRenderer('line')])
      .then(([{ PressScene }, renderer]) => {
        if (!renderer) throw new Error('no WebGL renderer');
        scene = new PressScene(renderer, { lowPower: env.lowPower, paper });
        if (process.env.NODE_ENV === 'development') window.__press = scene;
        scene.setProgress(progress);
        scene.render(0);
        new ResizeObserver(() => scene.resize()).observe(canvas);
      })
      .catch((err) => {
        console.warn('Press scene unavailable, showing the film instead.', err);
        fallback();
      });
    return building;
  };

  // built well before it scrolls into view, drawn only while it's on screen
  ScrollTrigger.create({ trigger: root, start: 'top 300%', once: true, onEnter: build });
  ScrollTrigger.create({
    trigger: root, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { visible = s.isActive; if (visible) build(); },
  });
  gsap.ticker.add((t) => { if (scene && visible && !document.hidden) scene.render(t); });

  let current = -1;
  const setStep = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((el, k) => el.classList.toggle('is-active', k === i));
    stepEl.textContent = String(i + 1).padStart(2, '0');
  };
  setStep(0);

  const nav = document.querySelector<HTMLElement>('[data-nav]');
  let wasLight = false;
  const proxy = { p: 0 };
  gsap.to(proxy, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: env.reduced ? true : 1 },
    onUpdate: () => {
      progress = proxy.p;
      scene?.setProgress(progress);
      bar.style.transform = `scaleX(${Math.min(1, progress / 0.86)})`;
      let i = 0;
      steps.forEach((el, k) => { if (progress >= Number(el.dataset.stepAt)) i = k; });
      setStep(i);
      // the words step aside before the melt
      const melt = scene ? scene.melt : Math.max(0, (progress - 0.86) / 0.14);
      ui.style.opacity = String(Math.max(0, 1 - Math.max(0, progress - 0.7) / 0.06));
      root.classList.toggle('is-melted', melt > 0.9);
      // once the paper has poured in, the nav reads on paper (src/motion/siteChrome.ts does the rest)
      const lightNav = nextIsLight && melt > 0.45;
      if (lightNav !== wasLight && root.getBoundingClientRect().top <= 38) { wasLight = lightNav; nav?.classList.toggle('is-light', lightNav); }
    },
  });

  // heading drift-in
  gsap.from(root.querySelectorAll<HTMLElement>('.line__head > *'), {
    y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: root, start: 'top 60%' },
  });
}
