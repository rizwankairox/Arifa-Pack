import * as THREE from 'three';
import gsap from 'gsap';
import { mouse } from '@/lib/env';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { productDots, makeDissolvable } from '@/three/parts/heroProducts';

/*
  The home page in dots.

  One field of warm points plays the whole opening: dust in a shaft of light while
  the page loads, the Arifa Pack logo (its own leaves and lettering), an aluminium
  container — and then, on the hero, one product family after another, each time
  condensing into the real product (in 3D, heroProducts.js: lit in a studio and posed
  with its dots) before breaking back into dots for the next.

  Units are CSS pixels of the canvas: the camera sits where the z = 0 plane maps 1:1
  onto it, origin at its centre, y up. A shape is `n` points plus a pose (tilt, turn,
  scale, offset). A morph hands every point from its place in one shape to its place
  in the next, eased and staggered per point on the GPU, arcing out of the plane on
  the way. Every shape is ordered left to right, so neighbours stay neighbours.
*/

const VERT = /* glsl */ `
  uniform float uT;
  uniform float uSpread;
  uniform float uTime;
  uniform float uSwirl;
  uniform float uDrift;
  uniform float uSize;
  uniform float uCamZ;
  uniform float uFocus;
  uniform float uAlpha;
  uniform mat3 uMatA;
  uniform vec3 uOffA;
  uniform mat3 uMatB;
  uniform vec3 uOffB;
  attribute vec3 aFrom;
  attribute vec3 aColA;
  attribute vec3 aColB;
  attribute float aDelay;
  attribute vec4 aRand;
  varying vec3 vCol;
  varying float vA;
  varying float vSoft;

  void main() {
    float d = aDelay * uSpread;
    float t = clamp((uT - d) / (1.0 - uSpread), 0.0, 1.0);
    float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
    vec3 a = uMatA * aFrom + uOffA;
    vec3 b = uMatB * position + uOffB;
    vec3 p = mix(a, b, e);
    // in flight: an arc out of the plane, each dot on its own heading
    float arc = sin(3.14159265 * e);
    float h = aRand.y * 6.2831853;
    p += vec3(cos(h), sin(h), aRand.z * 2.0 - 0.6) * arc * uSwirl * (0.35 + aRand.w);
    // and always a slow drift, so nothing is ever quite still
    p += vec3(
      sin(uTime * (0.31 + aRand.x * 0.4) + aRand.y * 40.0),
      cos(uTime * (0.27 + aRand.z * 0.4) + aRand.w * 40.0),
      sin(uTime * 0.23 + aRand.x * 40.0)
    ) * uDrift * (0.3 + aRand.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // depth of field: dots off the focal plane grow soft and dim, like bokeh
    float soft = clamp(abs(mv.z + uCamZ) / uFocus, 0.0, 1.0);
    float persp = uCamZ / max(1.0, -mv.z);
    float grain = mix(0.6, 1.5, aRand.w * aRand.w);
    gl_PointSize = uSize * grain * persp * (1.0 + soft * 3.0);
    vSoft = soft;
    vCol = mix(aColA, aColB, e);
    float twinkle = 0.74 + 0.26 * sin(uTime * (1.3 + aRand.z * 3.1) + aRand.y * 31.0);
    vA = uAlpha * twinkle * (1.0 + arc * 0.5) / (1.0 + soft * 3.5) / (grain * grain);
  }
`;

const FRAG = /* glsl */ `
  uniform float uInk;
  varying vec3 vCol;
  varying float vA;
  varying float vSoft;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float a = exp(-r2 * mix(4.2, 1.6, vSoft)) * vA;
    if (uInk > 0.5) {
      // ink on paper: near-black dots, keeping a deep version of any real colour (the leaves' green)
      float sat = clamp((max(vCol.r, max(vCol.g, vCol.b)) - min(vCol.r, min(vCol.g, vCol.b))) * 3.0, 0.0, 1.0);
      vec3 ink = mix(vec3(0.05, 0.05, 0.06), vCol * 0.5, sat);
      gl_FragColor = vec4(ink, min(1.0, a * 2.4));
    } else {
      gl_FragColor = vec4(vCol * a, a);
    }
  }
`;

const R = Math.random;
const TAU = Math.PI * 2;
const rgb = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const WARM = rgb(0xfff0dc);
const AMBER = rgb(0xffb466);
const EMBER = rgb(0xff8a3c);
const SILVER = rgb(0xe4e9ef);
const LEAF_HI = rgb(0x9fd23a);
const LEAF: [number, number[]][] = [[0, rgb(0xa6cd34)], [0.55, rgb(0x5eaa36)], [1, rgb(0x23893f)]];

const leafColour = (t) => {
  const k = t < LEAF[1][0] ? 0 : 1;
  const [t0, c0] = LEAF[k], [t1, c1] = LEAF[k + 1];
  return mixRgb(c0, c1, Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
};

// aluminium in warm light, with the odd glint of the logo's green
function alu(k = 1, warm = 0.3) {
  const b = k * (0.72 + R() * 0.4);
  const c = R() < 0.022 ? LEAF_HI : mixRgb(SILVER, WARM, Math.min(1, warm + R() * 0.25));
  return [c[0] * b, c[1] * b, c[2] * b];
}

// ── outlines: a rounded rectangle (half sizes a × b, corner r) or an ellipse; u ∈ [0, 1) around ──
function rrPoint(a, b, r, u) {
  r = Math.min(r, a, b);
  const sx = 2 * (a - r), sz = 2 * (b - r), arc = (Math.PI * r) / 2;
  let s = u * (2 * sx + 2 * sz + 4 * arc);
  const corner = (cx, cz, start) => (t) => [cx + r * Math.cos(start + t / r), cz + r * Math.sin(start + t / r)];
  const segs: [number, (t: number) => number[]][] = [
    [sz, (t) => [a, -(b - r) + t]],
    [arc, corner(a - r, b - r, 0)],
    [sx, (t) => [a - r - t, b]],
    [arc, corner(-(a - r), b - r, Math.PI / 2)],
    [sz, (t) => [-a, b - r - t]],
    [arc, corner(-(a - r), -(b - r), Math.PI)],
    [sx, (t) => [-(a - r) + t, -b]],
    [arc, corner(a - r, -(b - r), Math.PI * 1.5)],
  ];
  for (const [len, f] of segs) {
    if (s <= len) return f(s);
    s -= len;
  }
  return [a, -(b - r)];
}
// a point on an outline grown outward by g
const edge = (o, g, u) => (o.r === undefined
  ? [(o.a + g) * Math.cos(u * TAU), (o.b + g) * Math.sin(u * TAU)]
  : rrPoint(o.a + g, o.b + g, o.r + g, u));

// a vessel: flared walls, a base with pressed rings, a flat flange and a rolled edge, maybe a lid
function vessel(n, { bottom, top, H, flange = 0.04, bead = 0.011, ribs = [], flangeRibs = [], lid = null, warm = 0.3, w = {} }) {
  const parts = { walls: 0.4, base: 0.18, ribs: ribs.length ? 0.08 : 0, flange: flange ? 0.14 : 0, flangeRibs: flangeRibs.length ? 0.06 : 0, bead: 0.18, lid: lid ? 0.3 : 0, ...w };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), delay = new Float32Array(n);
  const put = (i, x, y, z, c, d = R()) => { pos.set([x, y, z], i * 3); col.set(c, i * 3); delay[i] = d; };
  const rise = (y) => Math.min(1, (y / H + 0.5) * 0.5 + R() * 0.5);
  const outer = flange + bead;
  for (let i = 0; i < n; i++) {
    let r = R() * total;
    const u = R();
    if ((r -= parts.walls) < 0) {
      const v = R();
      const [xb, zb] = edge(bottom, 0, u), [xt, zt] = edge(top, 0, u);
      const y = -H / 2 + H * v;
      put(i, xb + (xt - xb) * v, y, zb + (zt - zb) * v, alu(0.55 + v * 0.28, warm + v * 0.3), rise(y));
    } else if ((r -= parts.base) < 0) {
      const t = Math.sqrt(R());
      const [x, z] = edge(bottom, 0, u);
      put(i, x * t, -H / 2, z * t, alu(0.4, warm), rise(-H / 2));
    } else if ((r -= parts.ribs) < 0) {
      const k = ribs[Math.floor(R() * ribs.length)];
      const [x, z] = edge(bottom, 0, u);
      put(i, x * k, -H / 2 + 0.006, z * k, alu(0.78, warm + 0.4), rise(-H / 2));
    } else if ((r -= parts.flange) < 0) {
      const [x, z] = edge(top, flange * R(), u);
      put(i, x, H / 2, z, alu(0.78, warm + 0.4), rise(H / 2));
    } else if ((r -= parts.flangeRibs) < 0) {
      const [x, z] = edge(top, flange * flangeRibs[Math.floor(R() * flangeRibs.length)], u);
      put(i, x, H / 2 + 0.004, z, alu(0.95, warm + 0.5), rise(H / 2));
    } else if ((r -= parts.bead) < 0) {
      // the rolled edge: a small tube round the rim, brightest of all
      const ang = R() * TAU, tube = bead;
      const [x, z] = edge(top, outer, u);
      const [x2, z2] = edge(top, outer + 0.01, u);
      const nx = x2 - x, nz = z2 - z, nl = Math.hypot(nx, nz) || 1;
      put(i, x + (nx / nl) * Math.cos(ang) * tube, H / 2 - tube + Math.sin(ang) * tube, z + (nz / nl) * Math.cos(ang) * tube, alu(1.05, warm + 0.5), rise(H / 2));
    } else {
      // a lid, lifted and hinged open at the back
      const { o, y0, open, panel } = lid;
      let x, z;
      if (R() < 0.65) { const t = Math.sqrt(R()); [x, z] = edge(o, 0, u); x *= t; z *= t; }
      else { [x, z] = edge(o, R() < 0.5 ? 0 : -panel, u); }
      const back = -o.b;
      const dz = z - back;
      put(i, x, y0 + Math.sin(open) * dz, back + Math.cos(open) * dz, alu(0.82, warm + 0.4), R() * 0.4 + 0.6);
    }
  }
  return { pos, col, delay };
}

// a roll on its side (axis x): foil wound on a core, a sheet run out across the table
function roll(n, { R0 = 0.13, L = 0.92, sheet = 0.55, faint = 1 } = {}) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), delay = new Float32Array(n);
  const put = (i, x, y, z, c) => { pos.set([x, y, z], i * 3); col.set(c, i * 3); delay[i] = Math.min(1, (x / L + 0.5) * 0.6 + R() * 0.4); };
  for (let i = 0; i < n; i++) {
    const r = R();
    const x = (R() - 0.5) * L;
    if (r < 0.42) { // the wound surface
      const a = R() * TAU;
      put(i, x, Math.sin(a) * R0, Math.cos(a) * R0, alu(0.75 + Math.max(0, Math.sin(a)) * 0.35, 0.3));
    } else if (r < 0.58) { // the ends: the winding, ring by ring
      const a = R() * TAU, rr = R0 * (0.28 + 0.72 * Math.floor(R() * 9) / 8);
      put(i, (R() < 0.5 ? -0.5 : 0.5) * L, Math.sin(a) * rr, Math.cos(a) * rr, alu(0.9, 0.5));
    } else if (r < 0.64) { // the core
      const a = R() * TAU, rr = R0 * 0.24;
      put(i, x * 1.06, Math.sin(a) * rr, Math.cos(a) * rr, alu(0.5, 0.6));
    } else { // the sheet, falling off the front of the roll and running out flat
      const s = R();
      const reach = s * sheet;
      const curl = Math.min(1, reach / (R0 * 1.5));
      const a = -Math.PI / 2 + (1 - curl) * Math.PI / 2;
      const y = s < 0.25 ? Math.sin(a) * R0 : -R0 + Math.sin(reach * 18 + x * 6) * 0.004;
      const z = s < 0.25 ? R0 * Math.cos(a) + reach * 0.4 : R0 * 0.6 + reach;
      put(i, x * 0.98, y, z, alu(0.62 * faint, 0.35));
    }
  }
  return { pos, col, delay };
}

// a dispenser carton with cling film drawn out of it
function carton(n) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), delay = new Float32Array(n);
  const L = 1, Hh = 0.11, D = 0.11;
  const put = (i, x, y, z, c) => { pos.set([x, y, z], i * 3); col.set(c, i * 3); delay[i] = Math.min(1, (x + 0.5) * 0.6 + R() * 0.4); };
  for (let i = 0; i < n; i++) {
    const r = R();
    const x = (R() - 0.5) * L;
    if (r < 0.3) { // the twelve edges of the box, crisp
      const e = Math.floor(R() * 12);
      const sy = e & 1 ? 1 : -1, sz = e & 2 ? 1 : -1;
      if (e < 4) put(i, x, sy * Hh, sz * D, alu(0.78, 0.5));
      else if (e < 8) put(i, (e & 1 ? 0.5 : -0.5) * L, (R() * 2 - 1) * Hh, sz * D, alu(0.78, 0.5));
      else put(i, (e & 1 ? 0.5 : -0.5) * L, sz * Hh, (R() * 2 - 1) * D, alu(0.78, 0.5));
    } else if (r < 0.68) { // its faces, softer
      const f = Math.floor(R() * 4);
      const a = R() * 2 - 1;
      if (f === 0) put(i, x, Hh, a * D, alu(0.45, 0.4));
      else if (f === 1) put(i, x, -Hh, a * D, alu(0.32, 0.3));
      else if (f === 2) put(i, x, a * Hh, D, alu(0.5, 0.4));
      else put(i, x, a * Hh, -D, alu(0.32, 0.3));
    } else { // the film, pulled out over the front edge and draped
      const s = R();
      put(i, x * 0.96, Hh - s * 0.05 - s * s * 0.12, D + s * 0.42, alu(0.4 + (1 - s) * 0.3, 0.2));
    }
  }
  return { pos, col, delay };
}

// fork, spoon and knife, laid side by side
function cutlery(n, raster) {
  const pool = raster(300, 320, (ctx) => {
    const handle = (x) => { ctx.beginPath(); ctx.roundRect(x - 9, 150, 18, 160, 9); ctx.fill(); };
    // spoon
    ctx.beginPath(); ctx.ellipse(60, 72, 30, 46, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(52, 110); ctx.lineTo(68, 110); ctx.lineTo(70, 160); ctx.lineTo(50, 160); ctx.fill();
    handle(60);
    // fork
    ctx.beginPath(); ctx.roundRect(126, 86, 52, 48, [4, 4, 22, 22]); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.roundRect(127 + k * 13.5, 18, 8, 80, 4); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(140, 130); ctx.lineTo(164, 130); ctx.lineTo(160, 160); ctx.lineTo(144, 160); ctx.fill();
    handle(152);
    // knife
    ctx.beginPath(); ctx.moveTo(234, 160); ctx.lineTo(234, 30); ctx.quadraticCurveTo(236, 14, 248, 18); ctx.quadraticCurveTo(262, 70, 258, 160); ctx.fill();
    handle(246);
  });
  const pts = pick(pool, n);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), delay = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (pts[i * 2] - 150) / 370, z = (pts[i * 2 + 1] - 160) / 370;
    pos.set([x, (R() - 0.5) * 0.01, z], i * 3);
    col.set(alu(0.62, 0.35), i * 3);
    delay[i] = Math.min(1, (x + 0.5) * 0.6 + R() * 0.4);
  }
  return { pos, col, delay };
}

// the families, in hero order (src/sections/products/ProductGrid.tsx → HERO_STEPS), each with how it's shown
const FAMILIES = {
  container: { tilt: 0.62, turn: -0.6, spin: 0.26, build: (n) => vessel(n, { bottom: { a: 0.43, b: 0.28, r: 0.055 }, top: { a: 0.5, b: 0.34, r: 0.075 }, H: 0.2, ribs: [0.78, 0.56] }) },
  foil: { tilt: 0.5, turn: -0.55, spin: 0.2, build: (n) => roll(n) },
  platter: { tilt: 0.85, turn: -0.4, spin: 0.2, build: (n) => vessel(n, { bottom: { a: 0.43, b: 0.27 }, top: { a: 0.52, b: 0.35 }, H: 0.07, flange: 0.08, ribs: [0.7, 0.42], flangeRibs: [0.35, 0.7] }) },
  cutlery: { tilt: 0.95, turn: -0.35, spin: 0.16, build: (n, raster) => cutlery(n, raster) },
  pot: { tilt: 0.55, turn: 0, spin: 0.22, build: (n) => vessel(n, { bottom: { a: 0.27, b: 0.27, r: 0.27 }, top: { a: 0.36, b: 0.36, r: 0.36 }, H: 0.3, flange: 0.035, ribs: [0.62, 0.32] }) },
  film: { tilt: 0.42, turn: -0.5, spin: 0.2, build: (n) => carton(n) },
  cup: { tilt: 0.42, turn: 0, spin: 0.2, build: (n) => vessel(n, { bottom: { a: 0.17, b: 0.17, r: 0.17 }, top: { a: 0.25, b: 0.25, r: 0.25 }, H: 0.55, flange: 0, bead: 0.012, warm: 0.5, w: { walls: 0.62, base: 0.12, bead: 0.26 } }) },
  microwave: { tilt: 0.55, turn: -0.6, spin: 0.24, build: (n) => vessel(n, { bottom: { a: 0.36, b: 0.24, r: 0.06 }, top: { a: 0.4, b: 0.27, r: 0.07 }, H: 0.2, flange: 0.025, lid: { o: { a: 0.43, b: 0.3, r: 0.08 }, y0: 0.13, open: 0.55, panel: 0.045 } }) },
};

// every opaque pixel of a drawing, as [x, y] pairs
function rasterise(width, height, draw) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(width));
  c.height = Math.max(1, Math.ceil(height));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  draw(ctx);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const pts = [];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > 140) pts.push(x, y);
  }
  return pts;
}

const bounds = (pts) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]);
    y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]);
  }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1, w: x1 + 1 - x0, h: y1 + 1 - y0 };
};

// pick `n` of the pool's pixels, as evenly as the pool allows
function pick(pool, n) {
  const m = pool.length / 2;
  const out = new Float32Array(n * 2);
  const idx = new Uint32Array(m);
  for (let i = 0; i < m; i++) idx[i] = i;
  for (let i = 0; i < n; i++) {
    let j;
    if (i < m) {
      const k = i + Math.floor(R() * (m - i));
      j = idx[k]; idx[k] = idx[i]; idx[i] = j;
    } else j = idx[Math.floor(R() * m)];
    out[i * 2] = pool[j * 2] + R();
    out[i * 2 + 1] = pool[j * 2 + 1] + R();
  }
  return out;
}

/** where a shape stands: turned (x, y, z), scaled (s), spinning, and moved (off) */
type Pose = { x?: number; y?: number; z?: number; s?: number; spin?: number; turn?: number; sway?: number; off?: THREE.Vector3 };
/** where to put a shape: its size, and how far from the centre */
type Place = { s?: number; off?: { x?: number; y?: number; z?: number } };

const pose = (p: Pose = {}) => ({ x: 0, y: 0, z: 0, s: 1, spin: 0, off: new THREE.Vector3(), ...p });

export class DotField {
  canvas: any;
  n: any;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  aTo: any;
  aFrom: any;
  aColA: any;
  aColB: any;
  aDelay: any;
  rand: any;
  u: any;
  material: THREE.ShaderMaterial;
  points: THREE.Points;
  stage: THREE.Group;
  products: Map<any, any>;
  productU: any;
  shown: any;
  productPose: any;
  envTarget: any;
  poseA: any;
  poseB: any;
  tilt: any;
  paused: boolean;
  cache: Map<any, any>;
  ro: ResizeObserver;
  w: number;
  h: number;
  /** called after a resize with the new size in CSS pixels */
  onResize?: (w: number, h: number) => void;
  logoBox: any;

  // ink: true draws dark dots for a light page (normal blending) instead of light glowing on dark
  constructor(renderer: THREE.WebGLRenderer, { count = 14000, dpr = renderer.getPixelRatio(), ink = false } = {}) {
    // the renderer comes from <SceneCanvas> (src/three/SceneCanvas.tsx): React Three Fiber sizes it
    // and sets its pixel density for this device (src/three/quality.ts)
    const canvas = (this.canvas = renderer.domElement);
    this.n = count;
    this.renderer = renderer;
    this.renderer.setClearColor(0x000000, 0);
    // (for the products; the dots' own shader is untouched by it)
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 10, 40000);

    const n = count;
    const geo = new THREE.BufferGeometry();
    const attr = (size) => new THREE.BufferAttribute(new Float32Array(n * size), size).setUsage(THREE.DynamicDrawUsage);
    this.aTo = attr(3);
    this.aFrom = attr(3);
    this.aColA = attr(3);
    this.aColB = attr(3);
    this.aDelay = attr(1);
    const rand = new Float32Array(n * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = R();
    this.rand = rand;
    geo.setAttribute('position', this.aTo);
    geo.setAttribute('aFrom', this.aFrom);
    geo.setAttribute('aColA', this.aColA);
    geo.setAttribute('aColB', this.aColB);
    geo.setAttribute('aDelay', this.aDelay);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

    this.u = {
      uT: { value: 1 }, uSpread: { value: 0.5 }, uTime: { value: 0 }, uSwirl: { value: 0 },
      uDrift: { value: 22 }, uSize: { value: 2.5 * dpr }, uCamZ: { value: 1000 }, uFocus: { value: 520 },
      uAlpha: { value: 0 }, uInk: { value: ink ? 1 : 0 },
      uMatA: { value: new THREE.Matrix3() }, uOffA: { value: new THREE.Vector3() },
      uMatB: { value: new THREE.Matrix3() }, uOffB: { value: new THREE.Vector3() },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest: false,
      ...(ink ? { blending: THREE.NormalBlending } : { blending: THREE.AdditiveBlending, premultipliedAlpha: true }),
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.scene.add(this.points);

    // the products the dots become: a studio's light, and a stage that leans with the dots
    this.stage = new THREE.Group();
    this.points.add(this.stage);
    this.products = new Map(); // name → { object, view, dots }
    this.productU = { uReveal: { value: 0 }, uCell: { value: 4.5 * dpr }, uDisInv: { value: new THREE.Matrix4() } };
    this.shown = null;
    this.productPose = null;
    this.envTarget = null;

    // the pose of the shape being left (A) and of the one being formed (B)
    this.poseA = pose();
    this.poseB = this.poseA;
    this.tilt = { v: 1 }; // how far the field leans after the pointer
    this.paused = false;  // no turning (the hero's pause button, reduced motion)
    this.cache = new Map();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
  }

  #m4 = new THREE.Matrix4();
  #r4 = new THREE.Matrix4();
  #last = 0;
  #tick = null;

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // the distance at which one unit at z = 0 is one CSS pixel
    const z = h / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.camera.position.set(0, 0, z);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.u.uCamZ.value = z;
    this.onResize?.(w, h);
  }

  // move the canvas into a new home (the loader hands it to the hero) without the dots moving on screen
  adopt(replace) {
    const before = this.canvas.getBoundingClientRect();
    replace.replaceWith(this.canvas);
    this.canvas.className = replace.className;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.resize();
    const after = this.canvas.getBoundingClientRect();
    const dx = (before.left + before.width / 2) - (after.left + after.width / 2);
    const dy = (after.top + after.height / 2) - (before.top + before.height / 2);
    [this.poseA, this.poseB].forEach((p) => { p.off.x += dx; p.off.y += dy; });
  }

  // ── shapes: { pos, col, delay, pose }, local units, posed (turned, scaled, offset) at draw time ──
  #ordered(s, key = (i) => s.pos[i * 3]) {
    const n = this.n;
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => key(a) - key(b));
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), delay = new Float32Array(n);
    order.forEach((j, i) => {
      pos.set(s.pos.subarray(j * 3, j * 3 + 3), i * 3);
      col.set(s.col.subarray(j * 3, j * 3 + 3), i * 3);
      delay[i] = s.delay[j];
    });
    return { pos, col, delay };
  }

  // warm dust adrift in the light
  dust() {
    const n = this.n, { w, h } = this;
    const s = { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), delay: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      s.pos.set([(R() - 0.5) * w * 1.35, (R() - 0.5) * h * 1.35, -1100 + R() * 1500], i * 3);
      const k = 0.2 + R() * 0.5;
      const c = mixRgb(WARM, R() < 0.3 ? EMBER : AMBER, R());
      s.col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      s.delay[i] = R();
    }
    return { ...this.#ordered(s), pose: pose() };
  }

  // the logo's three leaves (the nav's own path data) beside ARIFA PACK set in a clean, wide grotesk;
  // on narrow screens the leaves sit above the name. Written in from the left.
  logo(leafPaths, { text = 'ARIFA PACK', font = 'Archivo', weight = 500, stacked = false, maxW = this.w * 0.62, maxH = this.h * 0.34, offY = 0 } = {}) {
    const leaves = leafPaths.map((d) => new Path2D(d));
    const lb0 = bounds(rasterise(800, 440, (ctx) => leaves.forEach((p) => ctx.fill(p))));
    // measure the name at a reference size
    const REF = 200;
    const setFont = (ctx, size) => {
      ctx.font = `${weight} ${size}px "${font}", "Helvetica Neue", Arial, sans-serif`;
      try { ctx.fontStretch = 'expanded'; } catch { /* older canvas */ }
      try { ctx.letterSpacing = `${(size * 0.09).toFixed(1)}px`; } catch { /* older canvas */ }
      ctx.textBaseline = 'alphabetic';
    };
    const m = document.createElement('canvas').getContext('2d');
    setFont(m, REF);
    const tm = m.measureText(text);
    const capH = tm.actualBoundingBoxAscent || REF * 0.72;
    const textW = tm.actualBoundingBoxRight + (tm.actualBoundingBoxLeft || 0) - REF * 0.09; // (trailing tracking)
    // lay out in reference units: leaves 2.3 × the cap height tall
    const leafH = capH * 2.3, leafS = leafH / lb0.h, leafW = lb0.w * leafS;
    const gap = capH * 0.55;
    const W0 = stacked ? Math.max(leafW, textW) : leafW + gap + textW;
    const H0 = stacked ? leafH + gap * 1.2 + capH : leafH;
    const scale = Math.min(maxW / W0, maxH / H0);
    const pad = 4;
    const W = W0 * scale + pad * 2, H = H0 * scale + pad * 2;
    const leafX = stacked ? (W0 - leafW) / 2 : 0, leafY = 0;
    const textX = stacked ? (W0 - textW) / 2 : leafW + gap;
    const baseY = stacked ? H0 : leafH / 2 + capH / 2;
    const drawLeaves = (ctx) => {
      ctx.setTransform(scale * leafS, 0, 0, scale * leafS, pad + (leafX - lb0.x0 * leafS) * scale, pad + (leafY - lb0.y0 * leafS) * scale);
      leaves.forEach((p) => ctx.fill(p));
    };
    const drawText = (ctx) => {
      setFont(ctx, REF * scale);
      ctx.fillText(text, pad + (textX + (tm.actualBoundingBoxLeft || 0)) * scale, pad + baseY * scale);
    };
    const poolL = rasterise(W, H, drawLeaves), poolG = rasterise(W, H, drawText);
    // the name gets a little more than its share, so thin strokes still read
    const nL = Math.round(this.n * poolL.length / (poolL.length + poolG.length * 1.35));
    const pl = pick(poolL, nL), pg = pick(poolG, this.n - nL);
    const lb = bounds(poolL);
    const n = this.n;
    const s = { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), delay: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      const isLeaf = i < nL;
      const px = isLeaf ? pl[i * 2] : pg[(i - nL) * 2];
      const py = isLeaf ? pl[i * 2 + 1] : pg[(i - nL) * 2 + 1];
      const x = px - W / 2, y = H / 2 - py;
      s.pos.set([x, y, (R() - 0.5) * 12], i * 3);
      let c, k;
      if (isLeaf) {
        c = leafColour(((px - lb.x0) / lb.w + (py - lb.y0) / lb.h) / 2);
        k = 0.85 + R() * 0.3;
      } else {
        // warm white, catching amber where the light falls from the top left
        c = mixRgb(WARM, AMBER, Math.max(0, 0.35 - y / H) * 0.5 + R() * 0.18);
        k = 0.78 + R() * 0.3;
      }
      s.col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      s.delay[i] = Math.min(1, (x / W + 0.5) * 0.75 + R() * 0.25);
    }
    this.logoBox = { w: W, h: H };
    return { ...this.#ordered(s), pose: pose({ off: new THREE.Vector3(0, offY, 0) }) };
  }

  // a product family, as dots; `p` sets size (s, px) and placement (off)
  family(name: string, p: Place = {}) {
    const f = FAMILIES[name] || FAMILIES.container;
    if (!this.cache.has(name)) this.cache.set(name, this.#ordered(f.build(this.n, rasterise)));
    const off = new THREE.Vector3(p.off?.x ?? 0, p.off?.y ?? 0, p.off?.z ?? 0);
    return { ...this.cache.get(name), pose: pose({ x: f.tilt, y: f.turn, spin: f.spin, ...p, off }) };
  }

  // ── shapes for the About page (src/sections/about/aboutStage.ts) ──

  // the logo's three leaves on their own, `size` px tall, with a little depth
  leaves(leafPaths: string[], { size = this.h * 0.6, off = {} as Place['off'] } = {}) {
    const paths = leafPaths.map((d) => new Path2D(d));
    const b = bounds(rasterise(800, 440, (ctx) => paths.forEach((p) => ctx.fill(p))));
    const scale = size / b.h, pad = 3;
    const W = b.w * scale + pad * 2, H = b.h * scale + pad * 2;
    const pool = rasterise(W, H, (ctx) => {
      ctx.setTransform(scale, 0, 0, scale, pad - b.x0 * scale, pad - b.y0 * scale);
      paths.forEach((p) => ctx.fill(p));
    });
    const pts = pick(pool, this.n), n = this.n;
    const s = { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), delay: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      const px = pts[i * 2], py = pts[i * 2 + 1];
      const x = px - W / 2, y = H / 2 - py;
      s.pos.set([x, y, (R() - 0.5) * size * 0.05], i * 3);
      const c = leafColour(((px / W) + (py / H)) / 2), k = 0.8 + R() * 0.35;
      s.col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      s.delay[i] = Math.min(1, (y / H + 0.5) * 0.6 + R() * 0.4); // bottom leaf first
    }
    return { ...this.#ordered(s), pose: pose({ y: -0.22, off: new THREE.Vector3(off.x ?? 0, off.y ?? 0, 0) }) };
  }

  // a word or a number set in a face and laid out as dots (e.g. 1997), at most maxW × maxH px
  text(str, { font = 'Archivo', weight = 800, maxW = this.w * 0.5, maxH = this.h * 0.42, off = {} as Place['off'] } = {}) {
    const REF = 300;
    const setFont = (ctx, size) => {
      ctx.font = `${weight} ${size}px "${font}", "Helvetica Neue", Arial, sans-serif`;
      try { ctx.fontStretch = 'expanded'; } catch { /* older canvas */ }
      ctx.textBaseline = 'alphabetic';
    };
    const m = document.createElement('canvas').getContext('2d');
    setFont(m, REF);
    const tm = m.measureText(str);
    const tw = tm.actualBoundingBoxRight + (tm.actualBoundingBoxLeft || 0);
    const th = tm.actualBoundingBoxAscent + (tm.actualBoundingBoxDescent || 0);
    const scale = Math.min(maxW / tw, maxH / th), pad = 4;
    const W = tw * scale + pad * 2, H = th * scale + pad * 2;
    const pool = rasterise(W, H, (ctx) => {
      setFont(ctx, REF * scale);
      ctx.fillText(str, pad + (tm.actualBoundingBoxLeft || 0) * scale, pad + tm.actualBoundingBoxAscent * scale);
    });
    const pts = pick(pool, this.n), n = this.n;
    const s = { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), delay: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      const x = pts[i * 2] - W / 2, y = H / 2 - pts[i * 2 + 1];
      s.pos.set([x, y, (R() - 0.5) * 18], i * 3);
      const c = R() < 0.05 ? LEAF_HI : mixRgb(SILVER, WARM, Math.max(0, 0.4 - y / H) + R() * 0.2);
      const k = 0.7 + R() * 0.35;
      s.col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      s.delay[i] = Math.min(1, (x / W + 0.5) * 0.7 + R() * 0.3);
    }
    return { ...this.#ordered(s), pose: pose({ off: new THREE.Vector3(off.x ?? 0, off.y ?? 0, 0) }) };
  }

  // a globe, unit size: dots over a sphere, gathered along its parallels and meridians, turning
  globe(p: Place = {}) {
    const n = this.n, r = 0.5;
    const s = { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), delay: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      let lat, lon;
      const k = R();
      if (k < 0.32) { lat = (Math.round((R() * 2 - 1) * 5) / 6) * (Math.PI / 2); lon = R() * TAU; } // parallels
      else if (k < 0.6) { lon = Math.floor(R() * 12) / 12 * TAU; lat = Math.asin(R() * 2 - 1); }   // meridians
      else { lat = Math.asin(R() * 2 - 1); lon = R() * TAU; }                                          // the surface
      const x = Math.cos(lat) * Math.cos(lon) * r, y = Math.sin(lat) * r, z = Math.cos(lat) * Math.sin(lon) * r;
      s.pos.set([x, y, z], i * 3);
      const c = k < 0.6 ? alu(0.95, 0.4) : alu(0.45, 0.25);
      if (R() < 0.03) c.splice(0, 3, ...LEAF_HI);
      s.col.set(c, i * 3);
      s.delay[i] = Math.min(1, (y / r + 1) * 0.35 + R() * 0.3);
    }
    const off = new THREE.Vector3(p.off?.x ?? 0, p.off?.y ?? 0, 0);
    return { ...this.#ordered(s), pose: pose({ x: 0.35, y: 0, spin: 0.14, ...p, off }) };
  }

  // six bright nodes on a ring, threaded together and to a hub: one node for each core value
  constellation(count = 6, p: Place = {}) {
    const n = this.n, R0 = 0.42;
    const s = { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), delay: new Float32Array(n) };
    const node = (k) => { const a = (k / count) * TAU - Math.PI / 2; return [Math.cos(a) * R0, Math.sin(a) * R0]; };
    for (let i = 0; i < n; i++) {
      const k = R();
      let x, y, z, c;
      if (k < 0.55) { // the nodes: small bright spheres
        const j = Math.floor(R() * count), [nx, ny] = node(j);
        const u = Math.acos(R() * 2 - 1), v = R() * TAU, rr = 0.055 * Math.cbrt(R());
        x = nx + Math.sin(u) * Math.cos(v) * rr; y = ny + Math.sin(u) * Math.sin(v) * rr; z = Math.cos(u) * rr;
        c = j % 2 ? alu(1.1, 0.5) : mixRgb(LEAF_HI, WARM, 0.25 + R() * 0.3).map((q) => q * (0.85 + R() * 0.3));
      } else if (k < 0.82) { // threads round the ring
        const j = Math.floor(R() * count), t = R();
        const [ax, ay] = node(j), [bx, by] = node((j + 1) % count);
        x = ax + (bx - ax) * t; y = ay + (by - ay) * t; z = (R() - 0.5) * 0.01;
        c = alu(0.55, 0.3);
      } else if (k < 0.94) { // spokes to the hub
        const j = Math.floor(R() * count), t = R(), [ax, ay] = node(j);
        x = ax * t; y = ay * t; z = (R() - 0.5) * 0.01;
        c = alu(0.32, 0.3);
      } else { // the hub
        const u = Math.acos(R() * 2 - 1), v = R() * TAU, rr = 0.07 * Math.cbrt(R());
        x = Math.sin(u) * Math.cos(v) * rr; y = Math.sin(u) * Math.sin(v) * rr; z = Math.cos(u) * rr;
        c = mixRgb(LEAF_HI, WARM, 0.2);
      }
      s.pos.set([x, y, z], i * 3);
      s.col.set(c, i * 3);
      s.delay[i] = Math.min(1, Math.hypot(x, y) * 1.4 + R() * 0.3);
    }
    const off = new THREE.Vector3(p.off?.x ?? 0, p.off?.y ?? 0, 0);
    return { ...this.#ordered(s), pose: pose({ x: 0.55, y: 0, spin: 0.1, ...p, off }) };
  }

  // ── the real products: 3D objects the dots can become (heroProducts.js) ──

  // take a product (centred, radius 0.6) and how it is shown: { x: lean, y: turn, sway }
  addProduct(name, object, view = {}) {
    if (this.products.has(name)) return;
    if (!this.envTarget) {
      // (the studio, made once: a soft, even room for the metal to reflect, a key light and a rim)
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const room = new RoomEnvironment();
      this.envTarget = pmrem.fromScene(room, 0.04);
      room.traverse((o: any) => { o.geometry?.dispose(); o.material?.dispose?.(); });
      pmrem.dispose();
      this.scene.environment = this.envTarget.texture;
      this.scene.environmentIntensity = 0.9;
      const key = new THREE.DirectionalLight(0xfff3e6, 1.5);
      key.position.set(-0.6, 1, 0.8);
      const rim = new THREE.DirectionalLight(0xdfe9ff, 1.1);
      rim.position.set(0.9, 0.5, -0.7);
      this.scene.add(key, rim);
    }
    makeDissolvable(object, this.productU);
    object.visible = false;
    this.stage.add(object);
    this.products.set(name, { object, view, dots: null });
  }

  hasProduct(name) { return this.products.has(name); }

  // the product as dots, scattered over its surfaces; `p` sets size (s, px) and placement (off)
  productShape(name: string, p: Place = {}) {
    const pr = this.products.get(name);
    if (!pr.dots) pr.dots = this.#ordered(productDots(pr.object, this.n));
    const v = pr.view;
    const off = new THREE.Vector3(p.off?.x ?? 0, p.off?.y ?? 0, p.off?.z ?? 0);
    return { ...pr.dots, pose: pose({ x: v.x ?? 0.5, y: v.y ?? 0, turn: v.y ?? 0, sway: v.sway ?? 0.3, spin: 0, s: p.s ?? 1, off }) };
  }

  // stand `name` where the dots being formed stand (its reveal is the caller's: productU.uReveal)
  showProduct(name) {
    this.products.forEach((pr, k) => { pr.object.visible = false; if (k === name) this.shown = pr.object; });
    this.productPose = this.poseB;
  }

  // ── showing and morphing ──

  // where every dot is right now, mid-morph (the shader's sums, on the CPU), so a new morph can
  // start from there instead of jumping: used when one family is chosen before the last has formed
  #snapshot() {
    const n = this.n, T = this.u.uT.value, sp = Math.min(0.95, this.u.uSpread.value), sw = this.u.uSwirl.value;
    const A = this.u.uMatA.value.elements, oa = this.u.uOffA.value;
    const B = this.u.uMatB.value.elements, ob = this.u.uOffB.value;
    const from = this.aFrom.array, to = this.aTo.array, ca = this.aColA.array, cb = this.aColB.array;
    const d = this.aDelay.array, r = this.rand;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.min(1, Math.max(0, (T - d[i] * sp) / (1 - sp)));
      const e = t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
      const i3 = i * 3, i4 = i * 4;
      const fx = from[i3], fy = from[i3 + 1], fz = from[i3 + 2];
      const tx = to[i3], ty = to[i3 + 1], tz = to[i3 + 2];
      const ax = A[0] * fx + A[3] * fy + A[6] * fz + oa.x, ay = A[1] * fx + A[4] * fy + A[7] * fz + oa.y, az = A[2] * fx + A[5] * fy + A[8] * fz + oa.z;
      const bx = B[0] * tx + B[3] * ty + B[6] * tz + ob.x, by = B[1] * tx + B[4] * ty + B[7] * tz + ob.y, bz = B[2] * tx + B[5] * ty + B[8] * tz + ob.z;
      const k = Math.sin(Math.PI * e) * sw * (0.35 + r[i4 + 3]), h = r[i4 + 1] * TAU;
      pos[i3] = ax + (bx - ax) * e + Math.cos(h) * k;
      pos[i3 + 1] = ay + (by - ay) * e + Math.sin(h) * k;
      pos[i3 + 2] = az + (bz - az) * e + (r[i4 + 2] * 2 - 0.6) * k;
      for (let c = 0; c < 3; c++) col[i3 + c] = ca[i3 + c] + (cb[i3 + c] - ca[i3 + c]) * e;
    }
    this.aFrom.array.set(pos);
    this.aColA.array.set(col);
    this.poseA = pose();
  }

  #load(shape, spread) {
    const s = typeof shape === 'function' ? shape() : shape;
    // what was being formed is now what is being left (or, mid-morph, wherever the dots are)
    if (this.u.uT.value < 1) this.#snapshot();
    else {
      this.aFrom.array.set(this.aTo.array);
      this.aColA.array.set(this.aColB.array);
      this.poseA = this.poseB;
    }
    this.aTo.array.set(s.pos);
    this.aColB.array.set(s.col);
    this.aDelay.array.set(s.delay);
    this.poseB = s.pose;
    [this.aTo, this.aFrom, this.aColA, this.aColB, this.aDelay].forEach((a) => { a.needsUpdate = true; });
    this.u.uSpread.value = spread;
    this.u.uT.value = 0;
  }

  set(shape) {
    this.u.uT.value = 1;
    this.#load(shape, 0);
    this.u.uT.value = 1;
    this.#load(shape, 0);
    this.poseA = this.poseB;
    this.u.uT.value = 1;
  }

  // a gsap timeline that carries the field into `shape` (a shape, or a function returning one)
  morph(shape, { duration = 2, spread = 0.5, swirl = 120 } = {}) {
    return gsap.timeline()
      .add(() => { this.#load(shape, spread); this.u.uSwirl.value = swirl; })
      .fromTo(this.u.uT, { value: 0 }, { value: 1, duration, ease: 'none', immediateRender: false }, 0);
  }

  #pose(p, mat, off, dt) {
    if (!this.paused) {
      // a product sways to and fro about its best side, so its mark is always in view; a drawn shape turns
      if (p.sway) { p.t = (p.t || 0) + dt; p.y = p.turn + Math.sin(p.t * 0.42) * p.sway; } else p.y += p.spin * dt;
    }
    this.#m4.makeRotationX(p.x).multiply(this.#r4.makeRotationY(p.y));
    if (p.z) this.#m4.multiply(this.#r4.makeRotationZ(p.z));
    if (p.s !== 1) this.#m4.multiply(this.#r4.makeScale(p.s, p.s, p.s));
    mat.setFromMatrix4(this.#m4);
    off.copy(p.off);
  }

  render(t) {
    const dt = Math.min(0.05, t - (this.#last || t));
    this.#last = t;
    this.u.uTime.value = t;
    this.#pose(this.poseB, this.u.uMatB.value, this.u.uOffB.value, dt);
    if (this.poseA !== this.poseB) this.#pose(this.poseA, this.u.uMatA.value, this.u.uOffA.value, dt);
    else { this.u.uMatA.value.copy(this.u.uMatB.value); this.u.uOffA.value.copy(this.u.uOffB.value); }
    // the whole field leans a little after the pointer
    const k = this.tilt.v;
    this.points.rotation.y += (mouse.nx * 0.14 * k - this.points.rotation.y) * 0.05;
    this.points.rotation.x += (mouse.ny * 0.09 * k - this.points.rotation.x) * 0.05;
    // the product stands exactly where its dots stand
    const ob = this.shown, ph = this.productPose;
    const on = !!ob && !!ph && this.productU.uReveal.value > 0.001;
    if (ob) ob.visible = on;
    if (on) {
      ob.position.copy(ph.off);
      ob.rotation.set(ph.x, ph.y, ph.z || 0);
      ob.scale.setScalar(ph.s);
      this.points.updateMatrixWorld(true);
      this.productU.uDisInv.value.copy(ob.matrixWorld).invert();
    }
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.#tick) return;
    this.#last = 0;
    this.#tick = (t) => this.render(t);
    gsap.ticker.add(this.#tick);
  }

  stop() {
    if (this.#tick) gsap.ticker.remove(this.#tick);
    this.#tick = null;
  }

  dispose() {
    this.stop();
    this.ro.disconnect();
    this.points.geometry.dispose();
    this.material.dispose();
    this.envTarget?.dispose();
    this.stage.traverse((o: any) => { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.()); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
