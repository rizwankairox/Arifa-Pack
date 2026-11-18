/*
  What this browser can do, and where the pointer is.
  Read every frame by the 3D scenes and by the page scripts. Browser-only: imported after the page
  has loaded (see src/motion/PageScripts.tsx), never on the server.
*/

const mq = (q: string) => window.matchMedia(q).matches;

// A stalled font download must not hold the intro or page setup indefinitely.
export const fontsReady: Promise<unknown> = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 2500))]);

export const env = {
  /** the visitor asked their system for less motion */
  reduced: mq('(prefers-reduced-motion: reduce)'),
  /** a mouse or trackpad (not a finger) */
  fine: mq('(hover: hover) and (pointer: fine)'),
  /** phone-sized screen */
  small: mq('(max-width: 720px)'),
  /** small screen or a slow processor: fewer dots, softer shadows (see src/three/quality.ts) */
  lowPower: mq('(max-width: 720px)') || (navigator.hardwareConcurrency || 8) <= 4,
  webgl: (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  })(),
};

/** pointer position in pixels (x, y), as -1…1 across the window (nx, ny), and its speed */
export const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, speed: 0 };

let lx = mouse.x;
let ly = mouse.y;
window.addEventListener(
  'pointermove',
  (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.nx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ny = (e.clientY / innerHeight) * 2 - 1;
  },
  { passive: true },
);

/** pointer speed, decays every frame (called from the main ticker) */
export function tickMouse() {
  const d = Math.hypot(mouse.x - lx, mouse.y - ly);
  mouse.speed += (d / 60 - mouse.speed) * 0.2;
  lx = mouse.x;
  ly = mouse.y;
}

// Play videos only while visible; attach their real source on first approach.
const vio = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      const v = target as HTMLVideoElement;
      if (isIntersecting) {
        if (v.dataset.src && !v.src) v.src = v.dataset.src;
        if (!v.dataset.manual) v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  },
  { rootMargin: '200px 0px 200px 0px' },
);

/** a muted video that plays only while it is on screen */
export function autoVideo(v: HTMLVideoElement) {
  v.muted = true;
  vio.observe(v);
}
