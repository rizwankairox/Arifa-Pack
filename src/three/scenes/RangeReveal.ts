import * as THREE from 'three';
import gsap from 'gsap';
import { mouse } from '@/lib/env';

/*
  Cursor-following media plate for the product index.
  The plate lags the cursor; its lag becomes a bend in the mesh and an RGB
  split in the image. Switching rows wipes the new media in from below with
  a slight overscan, like a print sliding across a light table.
*/

// The mesh is a unit plane scaled to pixel size, so every displacement here is
// expressed as a fraction of the plate (velocity px ÷ plate px), never raw pixels.
const vert = /* glsl */ `
  uniform vec2 uVel;
  uniform vec2 uPlane;
  uniform float uReveal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float bx = sin(uv.y * 3.14159);
    float by = sin(uv.x * 3.14159);
    vec2 drag = uVel / uPlane;            // lag as a share of the plate size
    p.x -= bx * drag.x * 0.3;             // ≤ ~5% bow at full speed
    p.y += by * drag.y * 0.3;
    p.y -= (1.0 - uReveal) * by * (18.0 / uPlane.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform sampler2D uPrev;
  uniform vec2 uSize;
  uniform vec2 uPrevSize;
  uniform vec2 uPlane;
  uniform float uSwap;
  uniform float uReveal;
  uniform vec2 uVel;
  uniform float uTime;
  varying vec2 vUv;

  vec2 cover(vec2 uv, vec2 size, float zoom) {
    float rp = uPlane.x / uPlane.y, ri = size.x / size.y;
    vec2 s = rp < ri ? vec2(rp / ri, 1.0) : vec2(1.0, ri / rp);
    return (uv - 0.5) * s / zoom + 0.5;
  }
  vec3 tap(sampler2D t, vec2 uv, vec2 size, float zoom, vec2 shift) {
    vec2 u = cover(uv, size, zoom);
    return vec3(texture2D(t, u + shift).r, texture2D(t, u).g, texture2D(t, u - shift).b);
  }

  void main() {
    vec2 shift = uVel * 0.00012;          // faint colour fringe only while moving
    float z = 1.0 + (1.0 - uSwap) * 0.12;
    vec3 cur = tap(uTex, vUv, uSize, z, shift);
    vec3 prv = tap(uPrev, vUv, uPrevSize, 1.0 + uSwap * 0.08, shift);
    float wave = sin(vUv.x * 6.0 + uTime * 2.0) * 0.03;
    // new media rises from the bottom edge over the previous one
    float k = smoothstep(uSwap * 1.2 - 0.1, uSwap * 1.2, vUv.y + wave);
    vec3 col = mix(cur, prv, k);
    // the plate itself also reveals bottom-up
    float a = smoothstep(uReveal * 1.15, uReveal * 1.15 - 0.08, vUv.y + wave * 0.5);
    gl_FragColor = vec4(col, a);
  }
`;

export class RangeReveal {
  canvas: any;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  loader: THREE.TextureLoader;
  cache: Map<any, any>;
  u: any;
  mesh: THREE.Mesh;
  pos: THREE.Vector2;
  active: any;
  items: any;
  planeW: any;
  w: number;
  h: number;
  planeH: number;
  drawn: any;

  constructor(renderer: THREE.WebGLRenderer, items) {
    // the renderer comes from <SceneCanvas> (src/three/SceneCanvas.tsx): React Three Fiber sizes it
    // and sets its pixel density for this device (src/three/quality.ts)
    this.canvas = renderer.domElement;
    this.renderer = renderer;
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    this.loader = new THREE.TextureLoader();
    this.cache = new Map();

    const blank = new THREE.DataTexture(new Uint8Array([20, 22, 26, 255]), 1, 1);
    blank.needsUpdate = true;
    this.u = {
      uTex: { value: blank }, uPrev: { value: blank },
      uSize: { value: new THREE.Vector2(1, 1) }, uPrevSize: { value: new THREE.Vector2(1, 1) },
      uPlane: { value: new THREE.Vector2(1, 1) },
      uSwap: { value: 1 }, uReveal: { value: 0 },
      uVel: { value: new THREE.Vector2() }, uTime: { value: 0 },
    };
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 24, 24),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: vert, fragmentShader: frag, transparent: true, depthTest: false })
    );
    this.scene.add(this.mesh);
    this.pos = new THREE.Vector2(innerWidth / 2, innerHeight / 2);
    this.active = null;
    this.items = items;
    this.resize();
  }

  media(item) {
    const src = item.dataset.media;
    if (this.cache.has(src)) return this.cache.get(src);
    let entry;
    if (item.dataset.kind === 'video') {
      const v = document.createElement('video');
      Object.assign(v, { src, muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
      v.setAttribute('muted', '');
      const t = new THREE.VideoTexture(v);
      t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      entry = { tex: t, video: v, size: new THREE.Vector2(1280, 532) };
      v.addEventListener('loadedmetadata', () => entry.size.set(v.videoWidth, v.videoHeight));
    } else {
      entry = { tex: null, size: new THREE.Vector2(619, 619) };
      entry.tex = this.loader.load(src, (t) => entry.size.set(t.image.width, t.image.height));
      entry.tex.minFilter = THREE.LinearFilter;
    }
    this.cache.set(src, entry);
    return entry;
  }

  preload() { this.items.forEach((i) => this.media(i)); }

  show(item) {
    if (this.active === item) return;
    const next = this.media(item);
    const prev = this.active ? this.media(this.active) : null;
    if (prev?.video) setTimeout(() => prev.video.pause(), 600);
    next.video?.play().catch(() => {});
    this.u.uPrev.value = this.u.uTex.value;
    this.u.uPrevSize.value.copy(this.u.uSize.value);
    this.u.uTex.value = next.tex;
    this.u.uSize.value = next.size;
    this.active = item;
    gsap.fromTo(this.u.uSwap, { value: 0 }, { value: 1, duration: 0.9, ease: 'expo.out' });
    gsap.to(this.u.uReveal, { value: 1, duration: 0.9, ease: 'expo.out', overwrite: true });
  }

  hide() {
    if (!this.active) return; // (already letting go)
    gsap.to(this.u.uReveal, { value: 0, duration: 0.6, ease: 'power3.in', overwrite: true });
    const a = this.active;
    this.active = null;
    if (a) {
      const m = this.media(a);
      setTimeout(() => !this.active && m.video?.pause(), 700);
    }
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    this.camera.updateProjectionMatrix();
    const pw = Math.min(Math.max(w * 0.18, 220), 340);
    this.planeW = pw; this.planeH = pw * 1.25;
    this.mesh.scale.set(pw, this.planeH, 1);
    this.u.uPlane.value.set(pw, this.planeH);
    this.w = w; this.h = h;
  }

  // still something on the canvas: showing, fading out, or a last visible frame not yet cleared
  get needsFrame() { return this.u.uReveal.value > 0 || this.drawn > 0; }

  render(time) {
    this.drawn = this.u.uReveal.value;
    // offset so the plate sits beside the cursor, not under it
    const tx = mouse.x + this.planeW * 0.5 + 56, ty = mouse.y;
    const px = this.pos.x, py = this.pos.y;
    this.pos.x += (tx - this.pos.x) * 0.12;
    this.pos.y += (ty - this.pos.y) * 0.12;
    const vx = THREE.MathUtils.clamp(this.pos.x - px, -40, 40);
    const vy = THREE.MathUtils.clamp(this.pos.y - py, -40, 40);
    this.u.uVel.value.x += (vx - this.u.uVel.value.x) * 0.2;
    this.u.uVel.value.y += (-vy - this.u.uVel.value.y) * 0.2;
    this.mesh.position.set(this.pos.x - this.w / 2, this.h / 2 - this.pos.y, 0);
    this.mesh.rotation.z = THREE.MathUtils.degToRad(-this.u.uVel.value.x * 0.05);
    this.u.uTime.value = time;
    this.renderer.render(this.scene, this.camera);
  }
}
