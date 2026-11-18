import * as THREE from 'three';
import { buildHeroShapes } from '@/three/parts/heroShapes';
import { buildHeroProp } from '@/three/parts/heroProps';
import { crinkleMaps, brushedMaps } from '@/three/parts/textures';

/*
  The hero's products, in 3D: the eight families as real objects, lit in a studio and
  turning gently, each carrying the official ARIFA PACK mark
  (public/images/brand/arifa-logo.svg) where the real product carries it —
    · container — the drawn tray, its printed board lid propped behind it
    · foil, film — the roll in front of its printed carton (heroProps.js)
    · platter   — the oval tray, a clear dome sticker on its floor
    · cutlery   — knife, fork and spoon held by a printed paper band
    · pot       — the round pot, a printed label on its wall
    · cup       — the small baking cup, the mark printed on the foil
    · microwave — the black base, its clear lid with the printed insert propped behind

  Each product is centred and scaled to fit a sphere of radius 0.6 (the dot field's local
  units). productDots() scatters points over a product's surfaces, coloured as they are
  there, so the dot field can form exactly that product before it appears.
*/

const NAVY = '#123c90';
const MARK = '/images/brand/arifa-logo.svg';
const MARK_ASPECT = 773 / 414;

// how each is shown: lean toward the camera (x), turn (y) and how far it sways either side
export const PRODUCT_VIEW = {
  container: { x: 0.5, y: -0.42, sway: 0.32 },
  foil: { x: 0.64, y: -0.26, sway: 0.26 },
  platter: { x: 0.78, y: -0.18, sway: 0.3 },
  cutlery: { x: 0.9, y: -0.12, sway: 0.24 },
  pot: { x: 0.5, y: 0.05, sway: 0.34 },
  film: { x: 0.64, y: -0.26, sway: 0.26 },
  cup: { x: 0.48, y: 0, sway: 0.34 },
  microwave: { x: 0.5, y: -0.4, sway: 0.32 },
};
const PRODUCT_KEYS = Object.keys(PRODUCT_VIEW);

// ── the mark ──
const marks = new Map();
function brandMark(ink = NAVY) {
  if (!marks.has(ink)) {
    marks.set(ink, fetch(MARK).then((r) => r.text()).then((svg) => new Promise((resolve, reject) => {
      const src = svg.replace('fill="#123c90"', `fill="${ink}"`).replace('<svg ', '<svg width="1546" height="828" ');
      const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    })));
  }
  return marks.get(ink);
}

function art(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// a fine paper grain over a printed ground
function paper(g, w, h, ground, k = 0.035) {
  g.fillStyle = ground;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 90; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * k})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}
const drawMark = (g, img, cx, top, width) => g.drawImage(img, cx - width / 2, top, width, width / MARK_ASPECT);
const FONT = '"Archivo", "Helvetica Neue", Arial, sans-serif';

// ── materials ──
function materials(lowPower) {
  const crinkle = crinkleMaps(9).normal;
  crinkle.repeat.set(3, 3);
  const brushed = brushedMaps(11).roughness;
  brushed.repeat.set(2, 2);
  return {
    alu: new THREE.MeshPhysicalMaterial({
      color: '#e4e7ea', metalness: 1, roughness: 0.34, roughnessMap: brushed, side: THREE.DoubleSide,
      normalMap: crinkle, normalScale: new THREE.Vector2(0.55, 0.55), envMapIntensity: 1,
    }),
    black: new THREE.MeshPhysicalMaterial({ color: '#0b0b0c', roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.18, side: THREE.DoubleSide, envMapIntensity: 0.9 }),
    board: new THREE.MeshStandardMaterial({ color: '#eceae4', roughness: 0.78 }),
    clear: new THREE.MeshPhysicalMaterial({
      color: '#f1f6f8', roughness: 0.05, clearcoat: 1, transparent: true, opacity: lowPower ? 0.3 : 0.26,
      depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6,
    }),
    printed: (map, extra = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.52, ...extra }),
  };
}

// ── shapes ──
let drawn = null;
function vessel(key, mat) {
  drawn ??= buildHeroShapes();
  const s = drawn.shapes[key];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(s.pos.slice(), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(s.nrm.slice(), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(drawn.uv.slice(), 2));
  geo.setIndex(drawn.index);
  const mesh = new THREE.Mesh(geo, mat);
  // the outside of the wall at height y (largest radius among the vertices there)
  const radiusAt = (y) => {
    let r = 0, best = Infinity;
    for (let i = 0; i < s.pos.length; i += 3) {
      const d = Math.abs(s.pos[i + 1] - y);
      if (d < best - 1e-4) { best = d; r = 0; }
      if (d <= best + 1e-4) r = Math.max(r, Math.hypot(s.pos[i], s.pos[i + 2]));
    }
    return r;
  };
  return { mesh, height: s.height, floor: s.floor, radiusAt };
}

const roundedRect = (w, h, r) => {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

// a flat lid: a rounded slab with its print on the face (+z), standing on its bottom edge and
// leaning back by `lean`, the print toward the camera
function proppedLid({ w, h, t, r, slab, print }) {
  const shape = roundedRect(w, h, r);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: t * 0.25, bevelSize: t * 0.25, bevelSegments: 2, curveSegments: 10 }), slab);
  const face = new THREE.ShapeGeometry(shape, 10);
  const p = face.attributes.position, uv = face.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  const printed = new THREE.Mesh(face, print);
  printed.position.z = t * 1.25 + 0.002;
  const lid = new THREE.Group();
  lid.add(body, printed);
  lid.position.y = h / 2;
  return lid;
}

// a band of print round the outside of a drawn wall (pot, cup), facing the camera (+z), as wide
// round the wall as its artwork's proportions say
function wallPrint(v, { y, height, map, extra }: { y: number; height: number; map: THREE.Texture<any>; extra?: any }) {
  const r0 = v.radiusAt(y + height / 2), r1 = v.radiusAt(y - height / 2);
  const lift = 0.024;
  const arc = (height * map.image.width / map.image.height) / ((r0 + r1) / 2 + lift);
  const geo = new THREE.CylinderGeometry(r0 + lift, r1 + lift, height, 64, 1, true, -arc / 2, arc);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.04, roughness: 0.45, ...extra }));
  m.position.y = y;
  return m;
}

// ── the products ──
function container(M, mark) {
  const v = vessel('container', M.alu);
  const g = new THREE.Group();
  g.add(v.mesh);
  const print = M.printed(art(1500, 1000, (c, W, H) => {
    paper(c, W, H, '#f3f1ec');
    drawMark(c, mark, W / 2, H * 0.08, W * 0.5);
    c.fillStyle = NAVY;
    c.font = `500 ${Math.round(H * 0.07)}px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('Aluminium Containers', W / 2, H * 0.6);
  }));
  const lid = proppedLid({ w: 2.3, h: 1.52, t: 0.03, r: 0.16, slab: M.board, print });
  const pivot = new THREE.Group();
  pivot.add(lid);
  pivot.position.set(0.02, 0, -0.84);
  pivot.rotation.x = -0.36;
  g.add(pivot);
  return g;
}

function microwave(M, mark) {
  const v = vessel('microwave', M.black);
  const g = new THREE.Group();
  g.add(v.mesh);
  const print = M.printed(art(1500, 1000, (c, W, H) => {
    paper(c, W, H, '#f1ede1');
    drawMark(c, mark, W / 2, H * 0.08, W * 0.42);
    c.textAlign = 'center';
    c.fillStyle = '#1d6a31';
    c.font = `800 ${Math.round(H * 0.085)}px ${FONT}`;
    c.fillText('MICROWAVE CONTAINER', W / 2, H * 0.66);
    c.fillStyle = '#7bb342';
    c.fillRect(W * 0.08, H * 0.74, W * 0.84, H * 0.1);
    c.fillStyle = '#ffffff';
    c.font = `600 ${Math.round(H * 0.04)}px ${FONT}`;
    c.fillText('✓ MICROWAVE SAFE    ✓ FREEZER SAFE    ✓ FOOD GRADE PP    ✓ REUSABLE', W / 2, H * 0.805);
  }), { roughness: 0.3 });
  // the clear lid, its printed insert framed by a clear rim
  const lid = proppedLid({ w: 2.0, h: 1.42, t: 0.05, r: 0.26, slab: M.clear, print: M.clear });
  const insert = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(1.64, 1.1, 0.12), 6), print);
  const p = insert.geometry.attributes.position, uv = insert.geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.64 + 0.5, p.getY(i) / 1.1 + 0.5);
  insert.position.z = 0.05 * 1.25 + 0.004; // (on the lid's face, not seen through it)
  lid.add(insert);
  const pivot = new THREE.Group();
  pivot.add(lid);
  pivot.position.set(0.04, 0, -0.74);
  pivot.rotation.x = -0.36;
  g.add(pivot);
  return g;
}

function platter(M, mark) {
  const v = vessel('platter', M.alu);
  const g = new THREE.Group();
  g.add(v.mesh);
  const w = v.floor.hx * 1.55, h = w * 0.52;
  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshPhysicalMaterial({
      map: art(1200, 624, (c, W, H) => {
        c.fillStyle = 'rgba(248,248,246,0.97)';
        c.beginPath(); c.ellipse(W / 2, H / 2, W / 2 - 8, H / 2 - 8, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(190,196,204,0.95)'; c.lineWidth = 10; c.stroke();
        drawMark(c, mark, W / 2 + W * 0.02, H * 0.2, W * 0.62);
      }),
      transparent: true, alphaTest: 0.03, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2,
    }),
  );
  sticker.rotation.x = -Math.PI / 2;
  sticker.position.y = v.floor.y + 0.012;
  g.add(sticker);
  return g;
}

function pot(M, mark) {
  const v = vessel('pot', M.alu);
  const g = new THREE.Group();
  g.add(v.mesh);
  const height = v.height * 0.46;
  g.add(wallPrint(v, {
    y: v.height * 0.42, height,
    map: art(1200, 520, (c, W, H) => {
      c.fillStyle = '#f7f7f4';
      c.beginPath(); c.roundRect(10, 10, W - 20, H - 20, 70); c.fill();
      c.strokeStyle = NAVY; c.lineWidth = 12;
      c.beginPath(); c.roundRect(26, 26, W - 52, H - 52, 58); c.stroke();
      drawMark(c, mark, W / 2, H * 0.17, W * 0.62);
    }),
  }));
  return g;
}

function cup(M, mark) {
  const v = vessel('cup', M.alu);
  const g = new THREE.Group();
  g.add(v.mesh);
  g.add(wallPrint(v, {
    y: v.height * 0.42, height: v.height * 0.5,
    map: art(1200, 680, (c, W, H) => drawMark(c, mark, W / 2, (H - W * 0.9 / MARK_ASPECT) / 2, W * 0.9)),
    extra: { metalness: 0, roughness: 0.5 },
  }));
  return g;
}

function cutlery(M, mark, lowPower) {
  const { object } = buildHeroProp('cutlery', { lowPower });
  // handles toward the camera, the heads away
  object.rotation.y = Math.PI / 2;
  const g = new THREE.Group();
  g.add(object);
  g.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(object);
  // the paper band: round all three handles, a little way up from their ends, just clear of them
  const span = bb.max.x - bb.min.x + 0.07, deep = 0.36;
  const z = bb.max.z - (bb.max.z - bb.min.z) * 0.3;
  let top0 = 0;
  const P = new THREE.Vector3();
  object.traverse((m: any) => {
    if (!m.isMesh) return;
    const pa = m.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      P.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld);
      if (Math.abs(P.z - z) < deep / 2 + 0.02) top0 = Math.max(top0, P.y);
    }
  });
  const tall = top0 + 0.025;
  const paperMat = new THREE.MeshStandardMaterial({ color: '#ece6d8', roughness: 0.8 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(span, tall, deep), paperMat);
  band.position.set((bb.min.x + bb.max.x) / 2, tall / 2 - 0.01, z);
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(span, deep),
    M.printed(art(1400, Math.round(1400 * deep / span), (c, W, H) => {
      paper(c, W, H, '#ece6d8');
      drawMark(c, mark, W / 2, H * 0.06, H * 0.88 * MARK_ASPECT);
    })),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.set(band.position.x, tall + 0.001 - 0.01, z);
  g.add(band, top);
  return g;
}

function roll(key, lowPower) {
  const crinkle = crinkleMaps(key === 'foil' ? 5 : 7);
  const maps = brushedMaps(key === 'foil' ? 3 : 4);
  const { object } = buildHeroProp(key, { maps, crinkle, lowPower });
  const g = new THREE.Group();
  g.add(object);
  return g;
}

// centred, and scaled to fit a sphere of radius 0.6
function normalise(inner) {
  const outer = new THREE.Group();
  outer.add(inner);
  outer.updateMatrixWorld(true);
  const sphere = new THREE.Box3().setFromObject(inner).getBoundingSphere(new THREE.Sphere());
  const k = 0.6 / sphere.radius;
  inner.scale.multiplyScalar(k);
  inner.position.sub(sphere.center.multiplyScalar(k));
  outer.updateMatrixWorld(true);
  return outer;
}

export async function buildHeroProducts({ lowPower = false } = {}) {
  const mark = await brandMark(NAVY);
  await document.fonts?.ready; // (the print is set in the site's own type)
  const M = materials(lowPower);
  const make = {
    container: () => container(M, mark),
    foil: () => roll('foil', lowPower),
    platter: () => platter(M, mark),
    cutlery: () => cutlery(M, mark, lowPower),
    pot: () => pot(M, mark),
    film: () => roll('film', lowPower),
    cup: () => cup(M, mark),
    microwave: () => microwave(M, mark),
  };
  const out = new Map();
  for (const k of PRODUCT_KEYS) out.set(k, normalise(make[k]()));
  return out;
}

// ── a product as dots ──
const pixels = new Map();
function texel(img, u, v) {
  if (!img || !(img.width || img.naturalWidth)) return null;
  let p = pixels.get(img);
  if (!p) {
    const w = Math.min(512, img.width || img.naturalWidth), h = Math.max(1, Math.round(w * (img.height || img.naturalHeight) / (img.width || img.naturalWidth)));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    p = { w, h, data: g.getImageData(0, 0, w, h).data };
    pixels.set(img, p);
  }
  const x = Math.min(p.w - 1, Math.max(0, Math.floor((((u % 1) + 1) % 1) * p.w)));
  const y = Math.min(p.h - 1, Math.max(0, Math.floor((1 - (((v % 1) + 1) % 1)) * p.h)));
  const i = (y * p.w + x) * 4;
  return [p.data[i] / 255, p.data[i + 1] / 255, p.data[i + 2] / 255, p.data[i + 3] / 255];
}

export function productDots(object, n) {
  object.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(object.matrixWorld).invert();
  const faces = []; // [mesh, rel, a, b, c, area, material]
  let total = 0;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  object.traverse((m) => {
    if (!m.isMesh || !m.visible) return;
    const rel = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const geo = m.geometry, pos = geo.attributes.position, idx = geo.index;
    const count = idx ? idx.count : pos.count;
    const mats = Array.isArray(m.material) ? m.material : null;
    for (let f = 0; f < count; f += 3) {
      const a = idx ? idx.getX(f) : f, b = idx ? idx.getX(f + 1) : f + 1, c = idx ? idx.getX(f + 2) : f + 2;
      A.fromBufferAttribute(pos, a).applyMatrix4(rel);
      B.fromBufferAttribute(pos, b).applyMatrix4(rel);
      C.fromBufferAttribute(pos, c).applyMatrix4(rel);
      const area = B.clone().sub(A).cross(C.clone().sub(A)).length() / 2;
      if (area <= 0) continue;
      let mat = m.material;
      if (mats) {
        const grp = geo.groups.find((gr) => f >= gr.start && f < gr.start + gr.count);
        mat = mats[grp ? grp.materialIndex : 0];
      }
      total += area;
      faces.push({ m, rel, a, b, c, mat, cum: total });
    }
  });
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), delay = new Float32Array(n);
  const P = new THREE.Vector3(), uvA = new THREE.Vector2(), uvB = new THREE.Vector2(), uvC = new THREE.Vector2();
  const tint = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const t = Math.random() * total;
    let lo = 0, hi = faces.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (faces[mid].cum < t) lo = mid + 1; else hi = mid; }
    const f = faces[lo];
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    const gp = f.m.geometry.attributes.position;
    A.fromBufferAttribute(gp, f.a); B.fromBufferAttribute(gp, f.b); C.fromBufferAttribute(gp, f.c);
    P.set(0, 0, 0).addScaledVector(A, u).addScaledVector(B, v).addScaledVector(C, w).applyMatrix4(f.rel);
    pos.set([P.x, P.y, P.z], i * 3);
    // its colour there: the print if it has one, else the material's own
    const mat = f.mat;
    tint.copy(mat.color || tint.set('#cccccc')).convertLinearToSRGB();
    let rgb = [tint.r, tint.g, tint.b];
    const uv = f.m.geometry.attributes.uv;
    if (mat.map && uv) {
      uvA.fromBufferAttribute(uv, f.a); uvB.fromBufferAttribute(uv, f.b); uvC.fromBufferAttribute(uv, f.c);
      const tu = uvA.x * u + uvB.x * v + uvC.x * w, tv = uvA.y * u + uvB.y * v + uvC.y * w;
      const px = texel(mat.map.image, tu * (mat.map.repeat?.x || 1), tv * (mat.map.repeat?.y || 1));
      if (px) rgb = px[3] > 0.1 ? [px[0] * rgb[0], px[1] * rgb[1], px[2] * rgb[2]] : [0.85, 0.87, 0.9];
    }
    // metal glints and falls away with the light; clear plastic barely shows
    let k = mat.metalness > 0.5 ? 0.72 + Math.random() * 0.5 : 0.9 + Math.random() * 0.2;
    if (mat.transparent && mat.opacity < 0.5 && !mat.map) k *= 0.55;
    col.set([(0.16 + rgb[0] * 0.84) * k, (0.16 + rgb[1] * 0.84) * k, (0.16 + rgb[2] * 0.84) * k], i * 3);
    delay[i] = Math.min(1, (P.x / 1.2 + 0.5) * 0.6 + Math.random() * 0.4);
  }
  return { pos, col, delay };
}

// ── appearing out of the dots ──
// Every product material gets the same patch: a fragment only shows once `uReveal` has reached it
// (across from the left, broken up), coming in as a fine screen of dots that swell until the
// surface is whole, with a little warm light where it is forming.
const HEAD_V = 'uniform mat4 uDisInv;\nvarying vec3 vDis;';
const HEAD_F = /* glsl */ `
uniform float uReveal;
uniform float uCell;
varying vec3 vDis;
float disHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float disNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(disHash(i), disHash(i + vec3(1, 0, 0)), f.x), mix(disHash(i + vec3(0, 1, 0)), disHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(disHash(i + vec3(0, 0, 1)), disHash(i + vec3(1, 0, 1)), f.x), mix(disHash(i + vec3(0, 1, 1)), disHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;
const MAIN_F = /* glsl */ `
  float disOrder = clamp(vDis.x * 0.8 + 0.5, 0.0, 1.0) * 0.55 + disNoise(vDis * 6.0) * 0.32 + disNoise(vDis * 29.0) * 0.13;
  float disK = clamp((uReveal * 1.26 - disOrder) / 0.26, 0.0, 1.0);
  if (disK <= 0.0) discard;
  if (disK < 0.64) { vec2 disG = fract(gl_FragCoord.xy / uCell) - 0.5; if (length(disG) > disK * 0.8) discard; }
  float disBand = disK * (1.0 - disK) * 4.0;`;

export function makeDissolvable(object, uniforms) {
  object.traverse((m: any) => {
    if (!m.isMesh) return;
    (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
      if (mat.userData.dissolve) return;
      mat.userData.dissolve = true;
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\n${HEAD_V}`)
          .replace('#include <project_vertex>', '#include <project_vertex>\nvDis = (uDisInv * modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>\n${HEAD_F}`)
          .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${MAIN_F}`)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.86, 0.62) * disBand * 0.4;');
      };
      mat.customProgramCacheKey = () => 'arifa-dissolve';
      mat.needsUpdate = true;
    });
  });
}
