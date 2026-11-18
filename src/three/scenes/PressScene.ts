import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import { buildContainer, buildLid, DIM } from '@/three/parts/containerGeometry';
import { brushedMaps, lidMaps } from '@/three/parts/textures';
import { loadMarkTextures } from '@/three/parts/markTexture';
import { mouse } from '@/lib/env';

const BG = 0x0b0907;

// a photographer's cove: one sheet that runs along the floor and curves up into the back wall
function cove({ y0, front, back, radius, height, width, mat }) {
  const prof = [];
  for (let i = 0; i <= 12; i++) prof.push([front + (back - front) * (i / 12), y0]);
  for (let i = 1; i <= 28; i++) {
    const a = (i / 28) * (Math.PI / 2);
    prof.push([back - Math.sin(a) * radius, y0 + (1 - Math.cos(a)) * radius]);
  }
  for (let i = 1; i <= 8; i++) prof.push([back - radius, y0 + radius + (height - radius) * (i / 8)]);
  const pos = [], idx = [];
  prof.forEach(([z, y]) => { pos.push(-width / 2, y, z, width / 2, y, z); });
  for (let i = 0; i < prof.length - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  return m;
}

// a soft dark pool, for the contact shadow under anything standing on the floor
let blob = null;
function blobShadow() {
  if (blob) return blob;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.5)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  blob = new THREE.CanvasTexture(c);
  return blob;
}

/*
  The press, in one shot.

  A single studio take of a four-column hydraulic press, scrubbed by scroll: the ram comes down, the
  blank is drawn into the die in one stroke (the container mesh morphs from the flat
  sheet to the formed part, pleats and rolled rim included), the ram lifts, the
  container rises out of the die, its embossed lid comes down and closes over the
  rim, and the camera settles over the lid as a light passes across the ARIFA PACK
  emboss. Then the paper of the next section washes up over the frame from the bottom,
  in rounded lobes, leaving islands of the picture behind (the melt overlay, below).

  setProgress(p) drives one paused GSAP timeline (0 → 10); the render loop reads its state.
*/
export class PressScene {
  canvas: any;
  lowPower: any;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  look: THREE.Vector3;
  fit: number;
  composer: any;
  uForm: any;
  containerMat: THREE.MeshPhysicalMaterial;
  containerDepth: THREE.MeshDepthMaterial;
  lidMat: THREE.MeshPhysicalMaterial;
  paintBody: any;
  paintDark: any;
  navy: any;
  yellow: any;
  steel: THREE.MeshStandardMaterial;
  steelDark: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  oxide: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  plateMat: THREE.MeshStandardMaterial;
  lens: THREE.MeshStandardMaterial;
  hazard: THREE.MeshStandardMaterial;
  coveMat: THREE.MeshStandardMaterial;
  key: THREE.SpotLight;
  flash: THREE.PointLight;
  info: any;
  press: THREE.Group;
  plate: THREE.Mesh;
  crownBottom: number;
  upper: THREE.Group;
  rod: THREE.Mesh;
  product: THREE.Group;
  container: THREE.Mesh;
  lid: THREE.Mesh;
  meltU: any;
  meltScene: THREE.Scene;
  meltCam: THREE.OrthographicCamera;
  st: any;
  tl: any;
  progress: any;
  sweep: THREE.PointLight;

  constructor(renderer: THREE.WebGLRenderer, { lowPower = false, paper = '#ecebe6' } = {}) {
    // the renderer comes from <SceneCanvas> (src/three/SceneCanvas.tsx): React Three Fiber sizes it
    // and sets its pixel density for this device (src/three/quality.ts)
    this.canvas = renderer.domElement;
    this.lowPower = lowPower;
    this.renderer = renderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 24, 52);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.8;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 80);
    this.look = new THREE.Vector3();
    this.fit = 1;

    this.#materials();
    this.#lights();
    this.#build();
    this.#melt(paper);
    this.#timeline();

    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: lowPower ? 0 : 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, this.camera));
    this.composer.addPass(new OutputPass());

    this.resize();
    this.setProgress(0);
  }

  // ── materials ──────────────────────────────────────────────────────────
  #materials() {
    const bm = brushedMaps();
    const alu = {
      color: 0xd2d6dc, metalness: 1, roughness: 0.42,
      roughnessMap: bm.roughness, normalMap: bm.normal, normalScale: new THREE.Vector2(0.14, 0.14),
      anisotropy: 0.6, side: THREE.DoubleSide,
    };
    // the container: one mesh, flat blank ↔ drawn part (containerGeometry.js), formed by uForm
    this.uForm = { value: 0 };
    const morph = (shader) => {
      shader.uniforms.uForm = this.uForm;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec3 formedPos;
          attribute vec3 formedNormal;
          attribute float aSeq;
          uniform float uForm;
          float formAmt() {
            float lin = clamp((uForm - aSeq * 0.42) / (1.0 - aSeq * 0.42), 0.0, 1.0);
            return mix(lin, lin * lin * (3.0 - 2.0 * lin), aSeq);
          }`)
        .replace('#include <begin_vertex>', 'vec3 transformed = mix(position, formedPos, formAmt());');
      if (shader.vertexShader.includes('#include <beginnormal_vertex>')) {
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          vec3 objectNormal = normalize(mix(vec3(0.0, 1.0, 0.0), formedNormal, formAmt()));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`);
      }
    };
    this.containerMat = new THREE.MeshPhysicalMaterial(alu);
    this.containerMat.onBeforeCompile = morph;
    this.containerMat.customProgramCacheKey = () => 'arifa-press-morph';
    this.containerDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
    this.containerDepth.onBeforeCompile = morph;
    this.containerDepth.customProgramCacheKey = () => 'arifa-press-morph-depth';
    this.lidMat = new THREE.MeshPhysicalMaterial({ ...alu, color: 0xbfc4ca, normalMap: lidMaps('83185').normal, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.5, anisotropy: 0.3 });

    // the machine: industrial paint under a light clear coat, machined and chromed steel
    const paint = (color, roughness = 0.5) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.12, roughness, clearcoat: 0.4, clearcoatRoughness: 0.38 });
    this.paintBody = paint(0x30353b);
    this.paintDark = paint(0x1c2025, 0.55);
    this.navy = paint(0x1d3566, 0.42);
    this.yellow = paint(0xe2a813, 0.45);
    this.steel = new THREE.MeshStandardMaterial({ color: 0xa3a9b1, metalness: 1, roughness: 0.32, normalMap: bm.normal, normalScale: new THREE.Vector2(0.08, 0.08) });
    this.steelDark = new THREE.MeshStandardMaterial({ color: 0x41464d, metalness: 0.95, roughness: 0.4, normalMap: bm.normal, normalScale: new THREE.Vector2(0.05, 0.05) });
    this.chrome = new THREE.MeshStandardMaterial({ color: 0xeef0f2, metalness: 1, roughness: 0.09 });
    this.oxide = new THREE.MeshStandardMaterial({ color: 0x16181b, metalness: 0.75, roughness: 0.36 });
    this.rubber = new THREE.MeshStandardMaterial({ color: 0x101113, metalness: 0, roughness: 0.82 });
    this.plateMat = new THREE.MeshStandardMaterial({ color: 0xb4bac2, metalness: 1, roughness: 0.3, normalMap: bm.normal, normalScale: new THREE.Vector2(0.1, 0.1) });
    this.lens = new THREE.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.2, roughness: 0.15, emissive: 0x7a1010, emissiveIntensity: 0.6 });
    // hazard stripes along the ram's leading edge
    const hz = document.createElement('canvas');
    hz.width = 256; hz.height = 32;
    const g = hz.getContext('2d');
    g.fillStyle = '#e2a813'; g.fillRect(0, 0, 256, 32);
    g.fillStyle = '#121316';
    for (let x = -32; x < 288; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 32); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0); g.fill(); }
    const hzt = new THREE.CanvasTexture(hz);
    hzt.colorSpace = THREE.SRGBColorSpace;
    hzt.wrapS = THREE.RepeatWrapping;
    hzt.repeat.set(10, 1);
    this.hazard = new THREE.MeshStandardMaterial({ map: hzt, roughness: 0.55, metalness: 0.1 });
    // the studio: a seamless cove, warm charcoal
    this.coveMat = new THREE.MeshStandardMaterial({ color: 0x2c2926, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  }

  // ── light: a warm key from high left, a broad soft box in front, a cool rim behind ──
  #lights() {
    RectAreaLightUniformsLib.init();
    const key = (this.key = new THREE.SpotLight(0xffe4c4, 620, 42, 0.62, 0.85, 1.6));
    key.position.set(-4, 12.5, 7.5);
    key.target.position.set(1.6, -0.6, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(this.lowPower ? 1024 : 2048, this.lowPower ? 1024 : 2048);
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.025;
    key.shadow.camera.near = 4;
    key.shadow.camera.far = 30;
    this.scene.add(key, key.target);

    // a big soft box, front left: the long, soft reflections that make chrome and paint read as real
    const soft = new THREE.RectAreaLight(0xfff4e8, 3.2, 8, 5);
    soft.position.set(-6.5, 5.5, 10);
    soft.lookAt(0.6, 1.2, 0);
    this.scene.add(soft);

    const rim = new THREE.DirectionalLight(0xa9bfff, 1.5);
    rim.position.set(7, 7, -6);
    this.scene.add(rim);
    this.scene.add(new THREE.HemisphereLight(0xfff1e2, 0x0b0907, 0.22));

    // the light that rakes across the lid during the close-up
    this.sweep = new THREE.PointLight(0xfff1dc, 0, 6, 1.5);
    this.scene.add(this.sweep);
    // the strike: a brief flash where punch meets die
    this.flash = new THREE.PointLight(0xffd7a8, 0, 5, 2);
    this.flash.position.set(0.6, 0.35, 1.9);
    this.scene.add(this.flash);
  }

  // ── the press ──────────────────────────────────────────────────────────
  #build() {
    const S = this.scene;
    const { geometry, info } = buildContainer(DIM);
    this.info = info;
    const top = info.height;
    const FLOOR = -2.2;

    // the studio: one seamless sheet, floor sweeping up into the back wall, so there is no horizon
    S.add(cove({ y0: FLOOR, front: 26, back: -6.5, radius: 6, height: 26, width: 90, mat: this.coveMat }));
    // soft contact shadows where things stand on the floor
    const contact = (w, d, x, z, k = 0.75) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, opacity: k, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, FLOOR + 0.004, z);
      S.add(m);
    };
    contact(9.5, 8.2, 0, 0.1);
    contact(4.6, 3.6, 5.1, 0, 0.5);

    const press = (this.press = new THREE.Group());
    S.add(press);
    const box = (parent, w, h, d, mat, x, y, z, r = 0.025) => {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const cyl = (parent, r, h, mat, x, y, z, seg = 40) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const hex = (parent, r, h, x, y, z) => cyl(parent, r, h, this.oxide, x, y, z, 6);

    // ── bed: a recessed plinth, the bed, the bolster with its T-slots ──
    box(press, 6.3, 0.18, 5.1, this.paintDark, 0, FLOOR + 0.09, 0, 0.02);
    box(press, 6.6, 1.02, 5.4, this.paintBody, 0, -1.51, 0, 0.05);
    box(press, 6.1, 0.1, 5.0, this.steelDark, 0, -0.95, 0, 0.012);
    [-2.85, 2.85].forEach((x) => box(press, 0.12, 0.012, 4.9, this.oxide, x, -0.897, 0, 0.004));

    // ── die set: lower shoe, the die (open at the cavity), and four guide pins ──
    box(press, 5.2, 0.13, 4.3, this.steelDark, 0, -0.835, 0, 0.012);
    const DW = 4.2, DD = 3.8;
    const [cx, cz] = [info.cavityHalf[0] + 0.02, info.cavityHalf[1] + 0.02];
    const dieH = 0.77, dieY = -dieH / 2;
    box(press, DW, dieH, DD / 2 - cz, this.steel, 0, dieY, -(cz + (DD / 2 - cz) / 2), 0.015);
    box(press, DW, dieH, DD / 2 - cz, this.steel, 0, dieY, cz + (DD / 2 - cz) / 2, 0.015);
    box(press, DW / 2 - cx, dieH, cz * 2, this.steel, -(cx + (DW / 2 - cx) / 2), dieY, 0, 0.015);
    box(press, DW / 2 - cx, dieH, cz * 2, this.steel, cx + (DW / 2 - cx) / 2, dieY, 0, 0.015);
    box(press, cx * 2, dieH - top - 0.02, cz * 2, this.steelDark, 0, -dieH + (dieH - top - 0.02) / 2, 0, 0.01);
    const pins = [[-2.42, -1.62], [2.42, -1.62], [-2.42, 1.62], [2.42, 1.62]];
    pins.forEach(([x, z]) => cyl(press, 0.07, 1.3, this.chrome, x, -0.12, z, 24));
    // cap screws round the die
    [[-1.9, -1.72], [1.9, -1.72], [-1.9, 1.72], [1.9, 1.72], [0, -1.72], [0, 1.72]].forEach(([x, z]) => cyl(press, 0.06, 0.03, this.oxide, x, 0.012, z, 16));

    // ── the maker's plate on the front of the bed ──
    const plate = (this.plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5 / (773 / 414)), new THREE.MeshStandardMaterial({ transparent: true, metalness: 0.4, roughness: 0.5 })));
    plate.position.set(0, -1.5, 2.722);
    plate.visible = false;
    press.add(plate);
    box(press, 1.75, 0.9, 0.02, this.plateMat, 0, -1.5, 2.71, 0.01);
    loadMarkTextures().then((t) => {
      if (!t?.dark) return;
      plate.material.map = t.dark;
      plate.material.needsUpdate = true;
      plate.visible = true;
    }).catch(() => {});

    // ── four columns, locked top and bottom; the crown and its cylinder ──
    const cols = [[-2.85, -2.2], [2.85, -2.2], [-2.85, 2.2], [2.85, 2.2]];
    cols.forEach(([x, z]) => {
      cyl(press, 0.19, 6.7, this.chrome, x, 2.35, z, 48);
      hex(press, 0.34, 0.3, x, -0.75, z);
      hex(press, 0.34, 0.3, x, 4.45, z);
      hex(press, 0.34, 0.3, x, 5.75, z);
    });
    this.crownBottom = 4.6;
    box(press, 6.6, 1.0, 5.4, this.paintBody, 0, 5.1, 0, 0.05);
    box(press, 6.7, 0.08, 5.5, this.paintDark, 0, 4.64, 0, 0.02);
    cyl(press, 1.18, 0.16, this.steelDark, 0, 5.68, 0, 64);
    cyl(press, 0.98, 1.25, this.paintBody, 0, 6.38, 0, 64);
    cyl(press, 1.04, 0.12, this.steelDark, 0, 7.06, 0, 64);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      hex(press, 0.07, 0.08, Math.cos(a) * 1.09, 5.8, Math.sin(a) * 1.09);
    }
    // its hoses, running back off the cylinder and down behind the machine
    const hose = (pts, r = 0.075) => {
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), 64, r, 12), this.rubber);
      m.castShadow = true;
      press.add(m);
    };
    hose([[-0.9, 6.7, -0.3], [-1.6, 6.9, -0.9], [-2.2, 6.3, -2.2], [-2.5, 5.0, -3.0], [-2.6, 2.0, -3.15], [-2.6, -1.9, -3.2], [-2.6, -2.12, -4.4]]);
    hose([[0.9, 6.3, -0.3], [1.7, 6.5, -1.0], [2.1, 5.9, -2.3], [2.3, 4.6, -3.0], [2.4, 1.0, -3.15], [2.4, -1.9, -3.2], [2.4, -2.12, -4.6]], 0.065);
    [[-0.92, 6.7, -0.25], [0.92, 6.3, -0.25]].forEach(([x, y, z]) => cyl(press, 0.11, 0.16, this.steel, x, y, z, 16).rotation.set(0, 0, Math.PI / 2));

    // ── the ram: rod, platen (with its hazard edge), upper die shoe with bushings, punch ──
    const upper = (this.upper = new THREE.Group());
    press.add(upper);
    box(upper, DIM.a0 * 2 - 0.03, 0.9, DIM.b0 * 2 - 0.03, this.steel, 0, 0.45, 0, DIM.r0 * 0.85);
    box(upper, 5.2, 0.2, 3.6, this.steelDark, 0, 1.0, 0, 0.012);
    pins.forEach(([x, z]) => cyl(upper, 0.13, 0.42, this.steel, x, 0.69, z, 24));
    box(upper, 6.2, 0.62, 5.0, this.navy, 0, 1.41, 0, 0.04);
    box(upper, 6.0, 0.07, 0.012, this.hazard, 0, 1.15, 2.506, 0.004);
    cols.forEach(([x, z]) => cyl(upper, 0.3, 0.8, this.steel, x, 1.41, z, 40));
    this.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1, 48), this.chrome);
    this.rod.castShadow = true;
    press.add(this.rod);

    // ── a safety light-curtain post at the front left (kept clear of the camera's view of the die) ──
    [-3.08].forEach((x) => {
      box(press, 0.13, 1.5, 0.13, this.yellow, x, -0.25, 2.48, 0.02);
      box(press, 0.03, 1.3, 0.05, this.lens, x - Math.sign(x) * 0.07, -0.22, 2.48, 0.006);
    });

    // ── the outfeed: a short belt conveyor beside the press ──
    const beltTop = 0.3 - top;
    const conv = new THREE.Group();
    S.add(conv);
    box(conv, 3.4, 0.05, 2.2, this.rubber, 5.1, beltTop - 0.025, 0, 0.02);
    [-1.18, 1.18].forEach((z) => box(conv, 3.7, 0.24, 0.07, this.plateMat, 5.1, beltTop - 0.07, z, 0.015));
    [3.38, 6.82].forEach((x) => {
      const r = cyl(conv, 0.1, 2.24, this.steelDark, x, beltTop - 0.1, 0, 24);
      r.rotation.x = Math.PI / 2;
    });
    const legH = beltTop - 0.19 - FLOOR;
    [[3.6, -1.1], [6.6, -1.1], [3.6, 1.1], [6.6, 1.1]].forEach(([x, z]) => box(conv, 0.09, legH, 0.09, this.plateMat, x, FLOOR + legH / 2, z, 0.01));
    [-1.1, 1.1].forEach((z) => box(conv, 3.0, 0.07, 0.07, this.plateMat, 5.1, FLOOR + 0.55, z, 0.01));

    // ── the part ──
    const product = (this.product = new THREE.Group());
    S.add(product);
    const cont = (this.container = new THREE.Mesh(geometry, this.containerMat));
    cont.customDepthMaterial = this.containerDepth;
    cont.castShadow = cont.receiveShadow = true;
    cont.frustumCulled = false;
    product.add(cont);
    const lid = buildLid(DIM, info);
    this.lid = new THREE.Mesh(lid.geometry, this.lidMat);
    this.lid.castShadow = this.lid.receiveShadow = true;
    product.add(this.lid);
  }

  // ── the melt: a full-screen overlay drawn over the frame ──
  #melt(paper) {
    this.meltU = {
      uMelt: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 },
      uPaper: { value: new THREE.Color(paper) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.meltU, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uMelt; uniform float uTime; uniform float uAspect;
        uniform vec3 uPaper;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.6;
          for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.07 + 17.3; a *= 0.36; }
          return v;
        }
        void main() {
          vec2 p = vec2(vUv.x * uAspect, vUv.y);
          // the paper comes up from the bottom of the frame like a wash: its edge is one contour of
          // a slow, rolling field, so it rises in rounded lobes and leaves islands of the picture behind
          float rise = uMelt * 1.55 - 0.28;
          float field = fbm(p * 2.1 + vec2(3.1, -uTime * 0.03)) - 0.45;
          // (a finer ripple on top, so small islands of the picture break away at the edge)
          float ripple = noise(p * 7.5 + vec2(1.7, -uTime * 0.05)) - 0.5;
          float d = rise - vUv.y + field * 0.6 + ripple * 0.09;
          float aa = fwidth(d) * 1.2 + 1e-4;   // a crisp, clean edge at any size
          float m = smoothstep(-aa, aa, d) * step(0.0001, uMelt);
          // (and, before the paper, a lens vignette on the shot itself)
          float v = smoothstep(0.42, 1.05, length((vUv - 0.5) * vec2(uAspect * 0.78, 1.0))) * 0.62;
          float a = m + v * (1.0 - m);
          gl_FragColor = vec4(uPaper * (m / max(a, 1e-4)), a);
          #include <colorspace_fragment>
        }`,
    });
    this.meltScene = new THREE.Scene();
    this.meltScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    this.meltCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  // ── the shot: one timeline, 0 → 10 ─────────────────────────────────────
  #timeline() {
    const top = this.info.height;
    const st = (this.st = {
      ram: 1.9, form: 0, shake: 0, flash: 0,
      py: 0, px: 0, turn: 0, lid: 1.7, lidVis: 0,
      cx: 10.2, cy: 7.6, cz: 20.6, tx: -1.3, ty: 2.5, tz: 0,
      sweep: 0, melt: 0,
    });
    const tl = (this.tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } }));
    tl
      // the press at rest; the camera comes in slowly
      .to(st, { cx: 5.4, cy: 3.1, cz: 9.4, tx: -0.4, ty: 0.3, duration: 3.0 }, 0)
      // the ram comes down, gathering speed…
      .to(st, { ram: 0, duration: 1.4, ease: 'power3.in' }, 0.6)
      // …and draws the blank into the die in one stroke
      .to(st, { ram: -top, form: 1, duration: 0.55, ease: 'power2.out' }, 2.0)
      .fromTo(st, { shake: 1 }, { shake: 0, duration: 0.7, ease: 'power2.out', immediateRender: false }, 2.0)
      .fromTo(st, { flash: 1 }, { flash: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, 2.0)
      // the ram goes back up
      .to(st, { ram: 2.2, duration: 1.4 }, 2.9)
      .to(st, { cx: 7.6, cy: 3.4, cz: 8.4, tx: 2.6, ty: 0.3, tz: 0, duration: 2.6 }, 3.0)
      // the container rises out of the die, slides out of the press onto the table and turns to the light
      .to(st, { py: 0.75, duration: 0.9, ease: 'power3.inOut' }, 4.0)
      .to(st, { px: 4.6, duration: 1.5, ease: 'power2.inOut' }, 4.6)
      .to(st, { py: 0.3, duration: 0.8, ease: 'power2.inOut' }, 5.3)
      .to(st, { turn: 0.5, duration: 1.4 }, 4.6)
      // its lid comes down and closes over the rim
      .set(st, { lidVis: 1 }, 5.8)
      .to(st, { lid: 0.006, duration: 0.8, ease: 'power3.in' }, 5.8)
      // over the lid: the light passes across the emboss
      .to(st, { cx: 4.95, cy: 3.55, cz: 1.3, tx: 4.6, ty: 0.3, tz: 0.04, duration: 1.7, ease: 'power2.inOut' }, 6.0)
      .to(st, { turn: 0, duration: 1.7 }, 6.0)
      .fromTo(st, { sweep: 0 }, { sweep: 1, duration: 1.9, ease: 'sine.inOut', immediateRender: false }, 6.7)
      // and the frame melts away into the paper of the next section
      .to(st, { melt: 1, duration: 1.4, ease: 'none' }, 8.6)
      // …while the picture keeps drifting up the frame, as if the page were still moving on
      .to(st, { cz: 2.15, tz: 0.9, duration: 1.4, ease: 'none' }, 8.6);
    tl.to({}, { duration: 0.01 }, 10);
  }

  setProgress(p) {
    this.progress = p;
    this.tl.progress(Math.min(1, Math.max(0, p)));
  }

  get melt() { return this.st.melt; }

  #apply(time) {
    const st = this.st;
    this.upper.position.y = st.ram;
    // the rod, from under the crown to the top of the platen
    const platenTop = st.ram + 1.72;
    const len = Math.max(0.05, this.crownBottom - platenTop);
    this.rod.scale.y = len;
    this.rod.position.y = platenTop + len / 2;
    this.uForm.value = st.form;

    this.product.position.set(st.px, st.py + 0.001, 0);
    this.product.rotation.set(0, st.turn, 0);
    this.lid.visible = st.lidVis > 0.5;
    this.lid.position.y = st.lid;

    // camera, with a little hand-held drift and the knock of the strike;
    // on narrow screens it steps back along its own line of sight
    const k = this.fit;
    const shake = st.shake * st.shake;
    this.look.set(st.tx, st.ty, st.tz);
    const cam = this.camera;
    cam.position.set(
      st.tx + (st.cx - st.tx) * k + mouse.nx * 0.16 + Math.sin(time * 47) * 0.03 * shake,
      st.ty + (st.cy - st.ty) * k - mouse.ny * 0.08 + Math.sin(time * 61 + 1) * 0.045 * shake,
      st.tz + (st.cz - st.tz) * k,
    );
    cam.lookAt(this.look);

    this.flash.intensity = st.flash * 30;
    this.sweep.intensity = Math.sin(st.sweep * Math.PI) * 6;
    this.sweep.position.set(st.px - 2.0 + st.sweep * 4.0, st.py + 0.7, 0.7 - st.sweep * 1.4);
    this.meltU.uMelt.value = st.melt;
    this.renderer.toneMappingExposure = 0.95 * (1 - 0.12 * Math.sin(Math.min(1, st.sweep) * Math.PI));
    this.meltU.uTime.value = time;
  }

  render(time = 0) {
    this.#apply(time);
    if (this.st.melt < 1) this.composer.render();
    const r = this.renderer;
    r.autoClear = false;
    r.render(this.meltScene, this.meltCam);
    r.autoClear = true;
  }

  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // narrow screens: a wider lens and a step back, so the press still fits across (and the fog follows)
    const aspect = w / h;
    this.camera.fov = aspect < 1 ? 46 : aspect < 1.4 ? 34 : 28;
    this.fit = aspect < 1 ? 1.3 : aspect < 1.4 ? 1.08 : 1;
    const fog = this.scene.fog as THREE.Fog;
    fog.near = 18 * this.fit;
    fog.far = 34 * this.fit;
    this.camera.updateProjectionMatrix();
    this.meltU.uAspect.value = w / h;
  }

  dispose() {
    this.renderer.dispose();
  }
}
