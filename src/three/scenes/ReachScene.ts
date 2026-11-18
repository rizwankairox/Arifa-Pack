import * as THREE from 'three';
import { buildArifaFactory, paintSign, rand } from '@/three/parts/arifaFactory';

/*
  The About page's reach scene: the Arifa factory in Al Jurf, Ajman, as a clean model
  in brand blue on a white ground. setProgress(p) drives it:
    0.00–0.44  the camera rises and pulls back; the neighbourhood falls away
    0.40–0.50  the factory folds down into the Ajman pin (the map takes over)
  The camera's look point is drawn at `anchor` (CSS px), which is where the pin will be.
*/

const COL = {
  context: 0xe7eaf0,
  tree: 0xffffff,
};

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const span = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t) => t * t * t;

export class ReachScene {
  canvas: any;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  anchor: any;
  w: number;
  h: number;
  p: number;
  t: number;
  dirty: boolean;
  pivot: THREE.Group;
  factory: any;
  mats: any;
  sign: any;
  office: any;
  sun: THREE.DirectionalLight;
  catcher: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.ShadowMaterial>;
  context: THREE.Group;
  ctxMat: THREE.MeshLambertMaterial;
  ctxTree: THREE.MeshLambertMaterial;

  constructor(renderer: THREE.WebGLRenderer, { lowPower = false } = {}) {
    // the renderer comes from <SceneCanvas> (src/three/SceneCanvas.tsx): React Three Fiber sizes it
    // and sets its pixel density for this device (src/three/quality.ts)
    this.canvas = renderer.domElement;
    const r = (this.renderer = renderer);
    r.setClearColor(0xffffff, 0);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, 1, 5000);
    this.target = new THREE.Vector3(0, 3, 0);
    this.anchor = { x: 0, y: 0 };
    this.w = 1;
    this.h = 1;
    this.p = 0;
    this.t = 0;
    this.dirty = true;

    this.#lights(lowPower);
    this.pivot = new THREE.Group(); // the factory folds down around this point (the pin)
    const f = buildArifaFactory();
    this.factory = f.group;
    this.mats = f.mats;
    this.sign = f.sign;
    this.office = f.office;
    this.pivot.add(this.factory);
    this.context = this.#context();
    this.scene.add(this.pivot, this.context);
  }

  // ── lights and the shadow catcher ──
  #lights(lowPower) {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd8e0f0, 2.1));
    const sun = (this.sun = new THREE.DirectionalLight(0xffffff, 1.55));
    sun.position.set(-60, 120, 80);
    sun.castShadow = true;
    const m = lowPower ? 1024 : 2048;
    sun.shadow.mapSize.set(m, m);
    const c = sun.shadow.camera;
    c.left = -90; c.right = 90; c.top = 90; c.bottom = -90; c.near = 20; c.far = 400;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);

    const catcher = (this.catcher = new THREE.Mesh(
      new THREE.PlaneGeometry(700, 700),
      new THREE.ShadowMaterial({ opacity: 0.12, transparent: true })
    ));
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    this.scene.add(catcher);
  }

  // the neighbourhood: pale blocks and trees that fall away as the camera rises
  #context() {
    const g = new THREE.Group();
    const m = (this.ctxMat = new THREE.MeshLambertMaterial({ color: COL.context, transparent: true }));
    const mt = (this.ctxTree = new THREE.MeshLambertMaterial({ color: COL.tree, flatShading: true, transparent: true }));
    const r = rand(42);
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2;
      const d = 78 + r() * 90;
      const w = 14 + r() * 22, dd = 14 + r() * 26, h = i % 7 === 0 ? 18 + r() * 14 : 5 + r() * 9;
      const mesh = new THREE.Mesh(box, m);
      mesh.scale.set(w, h, dd);
      mesh.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d);
      mesh.rotation.y = Math.round(r()) * 0.02;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    const crown = new THREE.IcosahedronGeometry(1.6, 0);
    for (let i = 0; i < 30; i++) {
      const a = r() * Math.PI * 2;
      const d = 62 + r() * 70;
      const t = new THREE.Mesh(crown, mt);
      t.position.set(Math.cos(a) * d, 2.4, Math.sin(a) * d);
      t.castShadow = true;
      g.add(t);
    }
    return g;
  }

  // the rooftop sign takes the site's own logo (leaves + ARIFA PACK), drawn from its SVG
  setSign(svgMarkup) {
    paintSign(this.sign, svgMarkup, () => { this.dirty = true; });
  }

  resize(w, h) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.#view();
    this.dirty = true;
  }

  // draw the look point at the anchor rather than the middle of the canvas
  setAnchor(x, y) {
    if (Math.abs(x - this.anchor.x) < 0.1 && Math.abs(y - this.anchor.y) < 0.1) return;
    this.anchor.x = x;
    this.anchor.y = y;
    this.#view();
    this.dirty = true;
  }

  #view() {
    this.camera.setViewOffset(this.w, this.h, this.w / 2 - this.anchor.x, this.h / 2 - this.anchor.y, this.w, this.h);
    this.camera.updateProjectionMatrix();
  }

  setProgress(p) {
    if (p === this.p) return;
    this.p = p;
    this.dirty = true;
  }

  get gone() {
    return this.p >= 0.46;
  }

  #pose() {
    const p = this.p;
    const k = inOut(span(p, 0.03, 0.42));
    // far enough back that the whole plot fits, on wide screens and tall phones alike
    const R0 = Math.max(205, 118 / (0.4618 * this.camera.aspect));
    const R = R0 * Math.pow(1100 / 205, k);
    const drift = Math.sin(this.t * 0.18) * 1.4 * (1 - k);
    const el = THREE.MathUtils.degToRad(lerp(24, 74, k));
    const az = THREE.MathUtils.degToRad(lerp(36, 14, k) + drift);
    this.target.set(0, lerp(3, 0, k), 0);
    this.camera.position.set(
      this.target.x + R * Math.cos(el) * Math.sin(az),
      this.target.y + R * Math.sin(el),
      this.target.z + R * Math.cos(el) * Math.cos(az)
    );
    this.camera.lookAt(this.target);

    // the neighbourhood and the shadows fall away; the factory folds into the pin
    const ctx = 1 - span(p, 0.08, 0.26);
    this.ctxMat.opacity = ctx;
    this.ctxTree.opacity = ctx;
    this.context.visible = ctx > 0.01;
    this.catcher.material.opacity = 0.12 * (1 - span(p, 0.3, 0.4));
    const s = 1 - easeIn(span(p, 0.36, 0.46));
    this.pivot.scale.setScalar(Math.max(0.0001, s));
    this.pivot.visible = s > 0.002;
  }

  // call every frame while the section is on screen; draws only when something moved
  frame(dt) {
    this.t += dt;
    const idle = this.p < 0.42;
    if (!this.dirty && !idle) return;
    this.#pose();
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }

  dispose() {
    this.renderer.dispose();
  }
}
