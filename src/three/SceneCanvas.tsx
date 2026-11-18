'use client';
/*
  A 3D canvas on the page, rendered with React Three Fiber.

  React owns the canvas: it creates the WebGL renderer with this scene's settings
  (src/three/quality.ts), keeps it sized to its box, and hands it to the page's scene code
  (src/three/renderers.ts). The scenes themselves (src/three/scenes) are hand-tuned Three.js
  that draw on GSAP's clock, so the 3D always moves in step with the smooth scroll.
  That is why the canvas's own frame loop is off ("never").

  On the server, and in a browser without WebGL, this is just an empty box with the same
  class, so the page's photo fallbacks take over.
*/
import { Canvas } from '@react-three/fiber';
import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import * as THREE from 'three';
import { SCENES, sceneDpr, type SceneName } from './quality';
import { provideRenderer } from './renderers';

type Props = {
  name: SceneName;
  /** the CSS class that positions it (e.g. "hero__gl") */
  className: string;
  /** the data attribute the page's scripts look it up by (e.g. "data-hero-gl") */
  dataAttr: string;
};

let webgl: boolean | undefined;
function hasWebGL() {
  if (webgl === undefined) {
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

// false while rendering on the server and hydrating, true once in the browser
const noSubscribe = () => () => {};
const useInBrowser = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

// Let the stylesheet place the canvas (React Three Fiber would otherwise make it position: relative).
const UNSET: CSSProperties = { position: undefined, width: undefined, height: undefined, overflow: undefined, pointerEvents: undefined };

export function SceneCanvas({ name, className, dataAttr }: Props) {
  const ok = useInBrowser() && hasWebGL();
  const box = { className, [dataAttr]: '', 'aria-hidden': true } as const;

  // no WebGL here: tell the page's scripts straight away, so they show the photo fallbacks
  useEffect(() => {
    if (!hasWebGL()) provideRenderer(name, null);
  }, [name]);

  if (!ok) return <div {...box} />;

  const settings = SCENES[name];
  return (
    <Canvas
      {...box}
      style={UNSET}
      frameloop="never"
      flat
      dpr={sceneDpr(name)}
      gl={(defaults) => new THREE.WebGLRenderer({ ...defaults, powerPreference: 'high-performance', ...settings.gl })}
      onCreated={({ gl }) => provideRenderer(name, gl)}
    />
  );
}
