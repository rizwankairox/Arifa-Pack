/*
  One place that decides how hard the 3D works on this device.

  Every 3D scene on the site reads its settings from here, so "lower the quality on weak phones"
  is a single decision instead of five. A phone-sized screen or a processor with 4 cores or fewer
  counts as low power: it draws at a lower pixel density, with fewer dots and softer shadows.
*/
import type { WebGLRendererParameters } from 'three';

export type SceneName = 'hero' | 'aboutStage' | 'line' | 'range' | 'reach' | 'delivery';

export type Tier = 'high' | 'low';

function qualityTier(): Tier {
  if (typeof window === 'undefined') return 'high';
  const small = window.matchMedia('(max-width: 720px)').matches;
  const fewCores = (navigator.hardwareConcurrency || 8) <= 4;
  return small || fewCores ? 'low' : 'high';
}

type SceneSettings = {
  /** how the WebGL drawing surface is created (antialiasing, transparency…) */
  gl: WebGLRendererParameters;
  /** the highest pixel density this scene draws at, per quality tier */
  maxDpr: Record<Tier, number>;
};

export const SCENES: Record<SceneName, SceneSettings> = {
  // the dots that become products (home hero) and the About page's chapters
  hero: { gl: { alpha: true, antialias: true, premultipliedAlpha: true }, maxDpr: { high: 2, low: 2 } },
  aboutStage: { gl: { alpha: true, antialias: true, premultipliedAlpha: true }, maxDpr: { high: 2, low: 2 } },
  // the press forming a container (home, "The line")
  line: { gl: { antialias: false, alpha: false }, maxDpr: { high: 1.75, low: 1.25 } },
  // the media plate that follows the cursor over the product list (home)
  range: { gl: { alpha: true, antialias: true, premultipliedAlpha: false }, maxDpr: { high: 1.75, low: 1.75 } },
  // the factory folding into the map (About)
  reach: { gl: { alpha: true, antialias: true }, maxDpr: { high: 1.75, low: 1.25 } },
  // the delivery town (Clients)
  delivery: { gl: { alpha: true, antialias: true }, maxDpr: { high: 1.75, low: 1.25 } },
};

/** the pixel density a scene should draw at on this device */
export function sceneDpr(name: SceneName): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, SCENES[name].maxDpr[qualityTier()]);
}
