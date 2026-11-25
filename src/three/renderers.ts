/*
  Hand-over point between React and the 3D scenes.

  <SceneCanvas name="hero" /> (a React Three Fiber canvas) creates the WebGL renderer when the
  page mounts and registers it here. The page's scripts (src/sections/…) then ask for it by name
  and build their Three.js scene on it.
*/
import type { WebGLRenderer } from 'three';
import type { SceneName } from './quality';

type Slot = { promise: Promise<WebGLRenderer | null>; resolve: (r: WebGLRenderer | null) => void; value?: WebGLRenderer | null };
const slots = new Map<SceneName, Slot>();

function slot(name: SceneName): Slot {
  let s = slots.get(name);
  if (!s) {
    let resolve!: Slot['resolve'];
    const promise = new Promise<WebGLRenderer | null>((r) => (resolve = r));
    s = { promise, resolve };
    slots.set(name, s);
  }
  return s;
}

/** called by SceneCanvas once its renderer exists (or with null when WebGL is unavailable) */
export function provideRenderer(name: SceneName, renderer: WebGLRenderer | null) {
  const s = slot(name);
  s.value = renderer;
  s.resolve(renderer);
}

/**
 * The renderer for a scene, once React has created it. Resolves null if this browser has no
 * WebGL or the renderer couldn't be made (both reported at once by SceneCanvas), or if it hasn't
 * appeared after `timeout` ms (a page without that canvas). The wait is generous: on a slow
 * machine, or the first load of the dev server, React can take several seconds to get there, and
 * giving up early would show the photographs to a browser that can draw the 3D.
 */
export function whenRenderer(name: SceneName, timeout = 15000): Promise<WebGLRenderer | null> {
  const s = slot(name);
  if (s.value !== undefined) return Promise.resolve(s.value);
  return Promise.race([s.promise, new Promise<null>((r) => setTimeout(() => r(null), timeout))]);
}

/** the renderer if it is ready right now (null otherwise) */
export function getRenderer(name: SceneName): WebGLRenderer | null {
  return slots.get(name)?.value ?? null;
}

/**
 * A scene's WebGL context was lost (the graphics card was reset, or the browser reclaimed it).
 * Its canvas would stay black, so it is hidden and its section marked "gl-lost"; the scene's page
 * script hears "arifa:gl-lost" ({ name }) and shows its photographs instead (the hero does).
 */
export function glLost(name: SceneName, canvas: HTMLCanvasElement) {
  console.warn(`3D scene "${name}" lost its graphics context; showing the photographs.`);
  const s = slots.get(name);
  if (s) s.value = null;
  canvas.style.visibility = 'hidden';
  canvas.closest('section')?.classList.add('gl-lost');
  window.dispatchEvent(new CustomEvent('arifa:gl-lost', { detail: { name } }));
}
