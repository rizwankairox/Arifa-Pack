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
import { Component, useEffect, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import * as THREE from 'three';
import { SCENES, sceneDpr, type SceneName } from './quality';
import { glLost, provideRenderer } from './renderers';
import { hasWebGL } from './probe';

type Props = {
  name: SceneName;
  /** the CSS class that positions it (e.g. "hero__gl") */
  className: string;
  /** the data attribute the page's scripts look it up by (e.g. "data-hero-gl") */
  dataAttr: string;
};

/** if the renderer can't be made (WebGL blocked or out of contexts), the box stays empty and the page's photo fallback shows */
class NoCrash extends Component<{ fallback: ReactNode; onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('3D scene unavailable, showing the photographs.', err); this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
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
    <NoCrash fallback={<div {...box} />} onError={() => provideRenderer(name, null)}>
      <Canvas
        {...box}
        style={UNSET}
        frameloop="never"
        flat
        dpr={sceneDpr(name)}
        // Measure the box only when it really changes size. By default React Three Fiber re-measures on
        // every scroll and reads the box *with* CSS transforms, so a section that scales while you scroll
        // (the hero shrinks to 0.94) resized the WebGL surface many times a second: the main stutter.
        // The scenes size their own drawing surface, so this only needs layout changes.
        resize={{ scroll: false, offsetSize: true, debounce: { scroll: 0, resize: 150 } }}
        // 'default' lets the browser choose the graphics chip; forcing the big one stalls some laptops while it switches
        gl={(defaults) => new THREE.WebGLRenderer({ ...defaults, powerPreference: 'default', ...settings.gl })}
        onCreated={({ gl }) => {
          // the graphics card was reset, or the browser took the context back: the page switches to its photographs
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); glLost(name, gl.domElement); }, { once: true });
          provideRenderer(name, gl);
        }}
      />
    </NoCrash>
  );
}
