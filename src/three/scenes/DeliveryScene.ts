import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildArifaFactory, paintSign, rand } from '@/three/parts/arifaFactory';

/*
  The Clients page's delivery scene: the Arifa factory (brand blue) on the middle block of a small
  white town laid out on a street grid: two-lane streets with dashed centre lines, kerbs, pavements,
  zebra crossings at the junctions and street trees. The industries it supplies stand on the blocks
  round it as sketch models (white blocks, ink edges), each on a driveway off the street.
  Scroll drives it. At each stop, three cartons are packed at the factory dock, then make their own
  way out of the gate and along the right-hand lane to that building (a green trail draws behind
  them), stack up at its door, and the building takes its colour. No vehicles: only the goods move.
  Timeline helpers (stopAt) are shared with the page script so the words and the picture agree.
*/

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const span = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const backOut = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// turn from heading a to b the short way; a carton is square, so a quarter turn is as good as a whole one
const turn = (a, b, t) => {
  const q = Math.PI / 2;
  let d = (b - a) % q;
  if (d > q / 2) d -= q;
  if (d < -q / 2) d += q;
  return a + d * t;
};

// the scroll's shape: a short opening, one segment per stop, a short close
const INTRO = 0.07;
const OUTRO = 0.07;
export function stopAt(p, n) {
  const w = (1 - INTRO - OUTRO) / n;
  if (p < INTRO) return { i: 0, u: 0, w, intro: true };
  if (p >= 1 - OUTRO) return { i: n - 1, u: 1, w, outro: true };
  const i = Math.min(n - 1, Math.floor((p - INTRO) / w));
  return { i, u: (p - INTRO - i * w) / w, w };
}
export const stopStart = (i, n) => INTRO + i * ((1 - INTRO - OUTRO) / n);

// ─── the town plan (world units; x runs east, z runs south, toward the camera) ───
const ROAD = 12; // carriageway, two lanes
const WALK = 3.4; // pavement, each side
const HALF = ROAD / 2;
const OUTER = HALF + WALK;
const LANE = 3; // the cartons keep to the right-hand lane, this far off the centre line
const DRIVE = 8; // driveway width
const EXT = 250; // how far the streets run out from the middle (the page fades them out)
const AVENUE = 64, BACK = -60, WEST = -52, EAST = 62; // the four streets round the factory's block
const STREETS = [
  { along: 'x', at: AVENUE }, // the avenue past the factory gate
  { along: 'x', at: BACK },
  { along: 'x', at: -186 },
  { along: 'x', at: 190 },
  { along: 'z', at: WEST },
  { along: 'z', at: EAST },
  { along: 'z', at: -176 },
  { along: 'z', at: 186 },
];
// from the loading doors, out through the gate onto the avenue
const DOCK = [-8, 28];
const GATE = [-8, 48]; // the gate in the plot's front edge
// each industry: where it stands, its way from the gate (street centre lines, the last leg its
// driveway to the door), and its colour
const PLACES = {
  bakeries: { at: [-92, 36], route: [[-92, AVENUE], [-92, 52]], kind: 'bakery', accent: 0xe8a23c },
  hotels: { at: [-90, -98], route: [[WEST, AVENUE], [WEST, BACK], [-90, BACK], [-90, -78]], kind: 'hotel', accent: 0x3d6fb0 },
  restaurants: { at: [104, -100], route: [[EAST, AVENUE], [EAST, BACK], [104, BACK], [104, -76]], kind: 'restaurant', accent: 0xe4572e },
  retail: { at: [105, 20], route: [[108, AVENUE], [108, 37]], kind: 'market', accent: 0x2a9d8f },
  catering: { at: [100, 110], route: [[100, AVENUE], [100, 84]], kind: 'events', accent: 0xb5509a },
  distributors: { at: [-104, 112], route: [[WEST, AVENUE], [WEST, 112], [-70, 112]], kind: 'warehouse', accent: 0x5b8e3e },
};
// spare lots for an industry the scene doesn't know
const SPARE = [
  { at: [-142, 22], route: [[-142, AVENUE], [-142, 48]] },
  { at: [156, 12], route: [[156, AVENUE], [156, 48]] },
];
// the rest of the town, kept low and small so the industries stand out:
// pale blocks set inside the street grid [x, z, width, depth, height] ...
const LOTS = [
  [-16, -94, 22, 18, 8], [28, -98, 20, 20, 13], [6, -148, 26, 20, 7],
  [-22, 98, 22, 16, 6], [2, 152, 28, 20, 8],
  [-94, -20, 22, 22, 9],
  [-142, -104, 22, 22, 14], [-100, -150, 26, 20, 8],
  [152, -104, 22, 24, 9], [108, -150, 28, 18, 7],
  [104, -28, 26, 18, 7],
  [152, 116, 20, 26, 8], [104, 160, 28, 20, 9],
  [-150, 116, 20, 28, 9], [-100, 160, 28, 20, 7],
];
const SPARE_LOTS = [[-142, 18, 22, 26, 8], [156, 12, 22, 30, 10]]; // built on unless a spare lot is in use
// ... and a few small parks [x, z, width, depth], a paved square with a grid of trees
const PARKS = [[28, 106, 22, 20], [152, -152, 24, 22], [-148, 160, 22, 22], [-146, -32, 22, 20]];

// the goods
const CW = 4.6, CH = 3.8; // carton footprint and height
const GAP = 5.6; // spacing between cartons on the road
const HOP = 1.3, HOP_LEN = 7; // a little hop as they go
const ROAD_Y = 0.12;
const CY = ROAD_Y + CH / 2; // a carton's centre, resting on the road

// a way along street centre lines with rounded corners, then moved into the right-hand lane
// (eased in after the gate and out before the door, so the cartons leave and arrive centred)
function lanePath(points) {
  const P = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const base = new THREE.CurvePath();
  let from = P[0].clone();
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i].clone().sub(P[i - 1]);
    const b = P[i + 1].clone().sub(P[i]);
    const r = Math.min(10, a.length() * 0.45, b.length() * 0.45);
    const s = P[i].clone().addScaledVector(a.normalize(), -r);
    const e = P[i].clone().addScaledVector(b.normalize(), r);
    base.add(new THREE.LineCurve3(from, s));
    base.add(new THREE.QuadraticBezierCurve3(s, P[i].clone(), e));
    from = e;
  }
  base.add(new THREE.LineCurve3(from, P[P.length - 1].clone()));
  const L = base.getLength();
  const steps = Math.ceil(L / 1.5);
  const pts = [];
  const p = new THREE.Vector3();
  for (let k = 0; k <= steps; k++) {
    const t = k / steps, d = t * L;
    base.getPoint(t, p);
    const tan = base.getTangent(t) as THREE.Vector3;
    const off = LANE * smooth(span(d, 14, 28)) * smooth(span(L - d, 0, 12));
    pts.push(new THREE.Vector3(p.x - tan.z * off, 0, p.z + tan.x * off)); // right of the heading
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curve.arcLengthDivisions = steps * 2;
  return curve;
}

// where a driveway (its street point q, its door d) meets the grid
function driveOf(q, d) {
  const s = STREETS.find((o) => (o.along === 'x' ? q[1] === o.at && d[0] === q[0] : q[0] === o.at && d[1] === q[1]));
  if (!s) return null;
  const k = s.along === 'x' ? 1 : 0;
  return { s, pos: q[1 - k], side: Math.sign(d[k] - q[k]), depth: Math.abs(d[k] - q[k]) };
}

// [a, b] with the gaps taken out
function without(a, b, gaps) {
  let out = [[a, b]];
  for (const [g0, g1] of gaps) out = out.flatMap(([x, y]) => (g1 <= x || g0 >= y ? [[x, y]] : [[x, g0], [g1, y]].filter(([m, n]) => n - m > 0.01)));
  return out;
}

export class DeliveryScene {
  canvas: any;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  anchor: any;
  w: number;
  h: number;
  p: number;
  dirty: boolean;
  factory: any;
  sign: any;
  ink: THREE.LineBasicMaterial;
  white: THREE.MeshLambertMaterial;
  roofMat: THREE.MeshLambertMaterial;
  glassMat: THREE.MeshLambertMaterial;
  kraft: THREE.MeshLambertMaterial;
  tape: THREE.MeshLambertMaterial;
  trailMat: THREE.MeshBasicMaterial;
  cartonGeo: any;
  tapeGeo: THREE.BoxGeometry;
  stops: any;

  constructor(renderer: THREE.WebGLRenderer, ids, { lowPower = false } = {}) {
    // the renderer comes from <SceneCanvas> (src/three/SceneCanvas.tsx): React Three Fiber sizes it
    // and sets its pixel density for this device (src/three/quality.ts)
    this.canvas = renderer.domElement;
    const r = (this.renderer = renderer);
    r.setClearColor(0xffffff, 0);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, 20, 6000);
    this.target = new THREE.Vector3();
    this.anchor = { x: 0, y: 0 };
    this.w = 1;
    this.h = 1;
    this.p = 0;
    this.dirty = true;

    this.#lights(lowPower);
    // the gate is cleared of the two plot trees that stand in it (group coordinates)
    const f = buildArifaFactory({ skipTree: (x, z) => z > 40 && Math.abs(x - (GATE[0] + 1)) < 9 });
    this.factory = f.group;
    this.sign = f.sign;
    this.scene.add(this.factory);

    this.ink = new THREE.LineBasicMaterial({ color: 0x1f2430, transparent: true, opacity: 0.62 });
    this.white = new THREE.MeshLambertMaterial({ color: 0xf4f5f7 });
    this.roofMat = new THREE.MeshLambertMaterial({ color: 0xe1e5eb });
    this.glassMat = new THREE.MeshLambertMaterial({ color: 0xdfe5ee });
    this.kraft = new THREE.MeshLambertMaterial({ color: 0xcfa774 });
    this.tape = new THREE.MeshLambertMaterial({ color: 0xeedcb0 });
    this.trailMat = new THREE.MeshBasicMaterial({ color: 0x5ba829 });
    this.cartonGeo = new RoundedBoxGeometry(CW, CH, CW, 2, 0.18);
    this.tapeGeo = new THREE.BoxGeometry(1.3, 0.06, CW + 0.04);

    const places = ids.map((id, k) => ({ id, ...(PLACES[id] || { ...SPARE[k % SPARE.length], kind: 'shop', accent: 0x5ba829 }) }));
    const drives = [driveOf([GATE[0], AVENUE], GATE), ...places.map((pl) => driveOf(pl.route[pl.route.length - 2], pl.route[pl.route.length - 1]))].filter(Boolean);
    const spareUsed = places.some((pl) => !PLACES[pl.id]);
    this.#roads(drives);
    this.#town(drives, spareUsed ? LOTS : [...LOTS, ...SPARE_LOTS], lowPower);
    this.stops = places.map((pl) => this.#stop(pl));
  }

  #lights(lowPower) {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd8e0f0, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(-120, 240, 160);
    sun.castShadow = true;
    const m = lowPower ? 1024 : 2048;
    sun.shadow.mapSize.set(m, m);
    const c = sun.shadow.camera;
    c.left = -240; c.right = 240; c.top = 240; c.bottom = -240; c.near = 40; c.far = 700;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.05;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.ShadowMaterial({ opacity: 0.1, transparent: true }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    this.scene.add(catcher);
  }

  // a mesh with ink edges, the sketch look
  #block(parent, geo, mat, x, y, z, { edges = true, cast = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), this.ink));
    parent.add(m);
    return m;
  }

  // flat rectangles on the ground [x0, z0, x1, z1], merged into one mesh
  #flat(rects, y, mat) {
    const pos = [], nor = [], idx = [];
    rects.forEach(([ax, az, bx, bz], i) => {
      const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), z0 = Math.min(az, bz), z1 = Math.max(az, bz);
      pos.push(x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0);
      nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      const a = i * 4;
      idx.push(a, a + 1, a + 2, a, a + 2, a + 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = true;
    this.scene.add(m);
    return m;
  }

  // the street grid: carriageways, pavements, kerbs, centre lines, zebra crossings and driveways
  #roads(drives) {
    const road = [], walk = [], marks = [], apron = [], kerb = [], edge = [];
    // a street's own frame (along it, across it) to the ground
    const R = (s, a0, a1, c0, c1) => (s.along === 'x' ? [a0, s.at + c0, a1, s.at + c1] : [s.at + c0, a0, s.at + c1, a1]);
    const seg = (out, s, a0, a1, c) => {
      const [x0, z0, x1, z1] = R(s, a0, a1, c, c);
      out.push(x0, 0, z0, x1, 0, z1);
    };
    for (const s of STREETS) {
      const cross = STREETS.filter((o) => o.along !== s.along).map((o) => o.at);
      road.push(R(s, -EXT, EXT, -HALF, HALF));
      for (const side of [-1, 1]) {
        const mouths = drives.filter((d) => d.s === s && d.side === side).map((d) => [d.pos - DRIVE / 2, d.pos + DRIVE / 2]);
        for (const [a, b] of without(-EXT, EXT, cross.map((c) => [c - HALF, c + HALF]))) walk.push(R(s, a, b, side * HALF, side * OUTER));
        for (const [a, b] of without(-EXT, EXT, [...cross.map((c) => [c - HALF, c + HALF]), ...mouths])) seg(kerb, s, a, b, side * HALF);
        for (const [a, b] of without(-EXT, EXT, [...cross.map((c) => [c - OUTER, c + OUTER]), ...mouths])) seg(edge, s, a, b, side * OUTER);
      }
      // the centre line, dashed, clear of the junctions
      for (let t = -EXT; t < EXT - 4; t += 8) {
        if (cross.every((c) => Math.abs(t + 2 - c) > OUTER + 4)) marks.push(R(s, t, t + 4, -0.18, 0.18));
      }
      // zebra crossings at every junction mouth, in line with the crossing street's pavements
      for (const c of cross) {
        for (const dir of [-1, 1]) {
          const a0 = c + dir * (HALF + 0.4), a1 = c + dir * (OUTER - 0.4);
          for (let i = 0; i < 6; i++) {
            const q = -HALF + 1.2 + (i + 0.5) * ((ROAD - 2.4) / 6);
            marks.push(R(s, a0, a1, q - 0.42, q + 0.42));
          }
        }
      }
    }
    // driveways from the kerb to the door, a step past it for the cartons to stack on
    for (const d of drives) {
      const c0 = d.side * HALF, c1 = d.side * (d.depth + 3);
      apron.push(R(d.s, d.pos - DRIVE / 2, d.pos + DRIVE / 2, c0, c1));
      for (const e of [-1, 1]) {
        const [x0, z0, x1, z1] = d.s.along === 'x' ? [d.pos + e * DRIVE / 2, d.s.at + c0, d.pos + e * DRIVE / 2, d.s.at + c1] : [d.s.at + c0, d.pos + e * DRIVE / 2, d.s.at + c1, d.pos + e * DRIVE / 2];
        kerb.push(x0, 0, z0, x1, 0, z1);
      }
    }
    this.#flat(walk, 0.06, new THREE.MeshLambertMaterial({ color: 0xf0f2f6 }));
    this.#flat(road, ROAD_Y, new THREE.MeshLambertMaterial({ color: 0xd2d7df }));
    this.#flat(apron, 0.15, new THREE.MeshLambertMaterial({ color: 0xdde1e7 }));
    this.#flat(marks, 0.18, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    const lines = (arr, opacity) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(arr.map((v, i) => (i % 3 === 1 ? 0.2 : v)), 3));
      this.scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x1f2430, transparent: true, opacity })));
    };
    lines(kerb, 0.3);
    lines(edge, 0.14);
  }

  // the rest of the town: pale blocks inside the grid, and trees along the pavements
  #town(drives, lots, lowPower) {
    const g = new THREE.Group();
    const r = rand(11);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const boxEdges = new THREE.EdgesGeometry(box);
    const mat = new THREE.MeshLambertMaterial({ color: 0xf2f3f6 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x232833, transparent: true, opacity: 0.18 });
    for (const [x, z, w, d, h] of lots) {
      const m = new THREE.Mesh(box, mat);
      m.scale.set(w, h, d);
      m.position.set(x, h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      m.add(new THREE.LineSegments(boxEdges, edgeMat));
      g.add(m);
    }
    this.scene.add(g);

    // the parks: a paved square with a grid of trees
    const spots = [];
    this.#flat(PARKS.map(([x, z, w, d]) => [x - w / 2, z - d / 2, x + w / 2, z + d / 2]), 0.06, new THREE.MeshLambertMaterial({ color: 0xedf0f4 }));
    for (const [x, z, w, d] of PARKS) {
      for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) spots.push([x + i * (w / 2 - 4) + (r() - 0.5) * 2, z + j * (d / 2 - 4) + (r() - 0.5) * 2]);
    }

    // street trees: a row down the middle of each pavement, clear of junctions and driveways
    const step = lowPower ? 22 : 16;
    for (const s of STREETS) {
      const cross = STREETS.filter((o) => o.along !== s.along).map((o) => o.at);
      for (const side of [-1, 1]) {
        for (let t = -EXT + 6; t < EXT - 6; t += step) {
          const a = t + (r() - 0.5) * 3;
          if (cross.some((c) => Math.abs(a - c) < OUTER + 3)) continue;
          if (drives.some((d) => d.s === s && d.side === side && Math.abs(a - d.pos) < DRIVE / 2 + 2.6)) continue;
          const c = s.at + side * (HALF + WALK / 2);
          spots.push(s.along === 'x' ? [a, c] : [c, a]);
        }
      }
    }
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.28, 2.4, 6), new THREE.MeshLambertMaterial({ color: 0xc9d0db }), spots.length);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.6, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), spots.length);
    const o = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      const k = 0.85 + r() * 0.35;
      o.position.set(x, 1.2, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      trunks.setMatrixAt(i, o.matrix);
      o.position.set(x, 2.2 + 1.6 * k, z);
      o.rotation.set(0, r() * Math.PI, 0);
      o.scale.set(k, k * 1.15, k);
      o.updateMatrix();
      crowns.setMatrixAt(i, o.matrix);
    });
    for (const m of [trunks, crowns]) {
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
    }
  }

  // a ribbon along a curve, just above the road; returns it so a trail can grow along it
  #ribbon(curve, width, y, mat, samples) {
    const pos = [];
    const idx = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k <= samples; k++) {
      const t = k / samples;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = new THREE.Vector3().crossVectors(up, tan).normalize().multiplyScalar(width / 2);
      pos.push(p.x + side.x, y, p.z + side.z, p.x - side.x, y, p.z - side.z);
      if (k < samples) {
        const a = k * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    this.scene.add(m);
    return { mesh: m, quads: samples };
  }

  #stop(place) {
    const [ax, az] = place.at;
    const door = place.route[place.route.length - 1];
    const curve = lanePath([DOCK, [GATE[0], AVENUE], ...place.route]);
    const len = curve.getLength();
    const trail = this.#ribbon(curve, 1.6, 0.21, this.trailMat, Math.ceil(len / 1.2));
    trail.mesh.geometry.setDrawRange(0, 0);

    // the building, facing its driveway
    const b = new THREE.Group();
    b.position.set(ax, 0, az);
    const yaw = Math.atan2(door[0] - ax, door[1] - az);
    b.rotation.y = yaw;
    const pale = new THREE.Color(0xffffff).lerp(new THREE.Color(place.accent), 0.3); // its colour, faint until delivered
    const accent = new THREE.MeshLambertMaterial({ color: pale });
    const top = this.#building(b, place.kind, accent);
    this.scene.add(b);

    // the three cartons (hidden until they're packed) and where they stack at the door:
    // two side by side, one on top, a step in from the end of the drive
    const cartons = [0, 1, 2].map(() => {
      const c = this.#carton();
      c.visible = false;
      this.scene.add(c);
      return c;
    });
    const fwd = new THREE.Vector3(ax - door[0], 0, az - door[1]).normalize();
    const side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const D = new THREE.Vector3(door[0], 0, door[1]).addScaledVector(fwd, 1.5);
    const slots = [
      D.clone().addScaledVector(side, -(CW / 2 + 0.1)).setY(CY),
      D.clone().addScaledVector(side, CW / 2 + 0.1).setY(CY),
      D.clone().setY(CY + CH),
    ];
    const hops = Math.max(1, Math.round((len - 2 * GAP) / HOP_LEN));

    return { id: place.id, curve, len, hops, trail, cartons, slots, yaw, accent, color: new THREE.Color(place.accent), grey: pale, at: new THREE.Vector3(ax, 0, az), top };
  }

  #building(g, kind, accent) {
    const W = this.white, R = this.roofMat, G = this.glassMat;
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const blk = (geo, m, x, y, z, o?) => this.#block(g, geo, m, x, y, z, o);
    switch (kind) {
      case 'bakery': {
        blk(box(24, 10, 16), W, 0, 5, 0);
        blk(box(25, 0.8, 17), R, 0, 10.4, 0);
        const aw = blk(box(24, 0.5, 6), accent, 0, 7.2, 10.2);
        aw.rotation.x = 0.35;
        blk(box(14, 2.6, 0.6), accent, 0, 12.8, 7.4);
        blk(box(2.2, 6, 2.2), W, 7, 13, -3);
        blk(box(8, 5.5, 0.3), G, -5, 3, 8.1, { cast: false });
        return 18;
      }
      case 'hotel': {
        blk(box(22, 46, 18), W, 0, 23, 0);
        for (let y = 6; y < 46; y += 5) blk(box(22.4, 0.35, 18.4), R, 0, y, 0, { cast: false });
        blk(box(23, 1, 19), R, 0, 46.5, 0);
        blk(box(12, 3.4, 0.7), accent, 0, 49.5, 6);
        blk(box(12, 0.6, 5), accent, 0, 5.2, 11.4);
        return 54;
      }
      case 'restaurant': {
        blk(box(26, 9, 18), W, 0, 4.5, 0);
        blk(box(27, 0.8, 19), R, 0, 9.4, 0);
        blk(box(17, 4.2, 0.8), accent, 0, 12, 8.4);
        blk(box(18, 5, 0.3), G, 0, 3.2, 9.1, { cast: false });
        for (const x of [-9, 0, 9]) {
          blk(new THREE.CylinderGeometry(0.25, 0.25, 5, 6), R, x, 2.5, 16, { edges: false });
          blk(new THREE.ConeGeometry(3.6, 2, 8), accent, x, 5.4, 16);
        }
        return 18;
      }
      case 'market': {
        blk(box(44, 10, 26), W, 0, 5, 0);
        blk(box(45, 1, 27), R, 0, 10.5, 0);
        blk(box(26, 4.4, 0.8), accent, 0, 13.4, 12);
        blk(box(30, 5.5, 0.3), G, 0, 3.2, 13.1, { cast: false });
        for (let i = 0; i < 7; i++) blk(box(0.25, 0.04, 8), R, -18 + i * 6, 0.2, 22, { edges: false, cast: false });
        return 20;
      }
      case 'events': {
        blk(box(32, 1.2, 26), W, 0, 0.6, 0);
        const roof = blk(new THREE.ConeGeometry(21, 12, 4), accent, 0, 12, 0);
        roof.rotation.y = Math.PI / 4;
        for (const [x, z] of [[-14, -11], [14, -11], [-14, 11], [14, 11]]) blk(new THREE.CylinderGeometry(0.4, 0.4, 7, 6), W, x, 4.5, z);
        for (const x of [-8, 0, 8]) blk(new THREE.CylinderGeometry(2.2, 2.2, 1.6, 12), R, x, 2, 0);
        return 22;
      }
      case 'warehouse': {
        blk(box(40, 12, 28), W, 0, 6, 0);
        const s = new THREE.Shape();
        s.moveTo(-20.6, 0); s.lineTo(20.6, 0); s.lineTo(0, 4); s.closePath();
        const rg = new THREE.ExtrudeGeometry(s, { depth: 29, bevelEnabled: false });
        rg.translate(0, 0, -14.5);
        blk(rg, R, 0, 12, 0);
        for (const x of [-12, 0, 12]) blk(box(7, 7, 0.4), accent, x, 3.5, 14.2, { cast: false });
        for (const x of [-12, 12]) { blk(box(5, 4.4, 12), W, x, 2.4, 24); blk(box(5, 3, 4), R, x, 1.8, 32); }
        return 18;
      }
      default:
        blk(box(20, 10, 16), W, 0, 5, 0);
        blk(box(12, 3, 0.6), accent, 0, 12, 8);
        return 15;
    }
  }

  #carton() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(this.cartonGeo, this.kraft);
    c.castShadow = true;
    g.add(c);
    const t = new THREE.Mesh(this.tapeGeo, this.tape);
    t.position.y = CH / 2 + 0.02;
    g.add(t);
    return g;
  }

  setSign(svgMarkup) {
    paintSign(this.sign, svgMarkup, () => { this.dirty = true; });
  }

  resize(w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (w === this.w && h === this.h) return; // same size: nothing to rebuild
    this.w = w;
    this.h = h;
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.#view();
    this.dirty = true;
  }

  setAnchor(x, y) {
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

  // where the camera looks for a stop: halfway between the dock and the building, closer in
  #focus(i) {
    if (i < 0) return { t: new THREE.Vector3(6, 0, 12), k: 1 };
    const s = this.stops[i];
    return { t: new THREE.Vector3(lerp(DOCK[0], s.at.x, 0.5), 0, lerp(DOCK[1], s.at.z, 0.5) + 10), k: 0.66 };
  }

  #pose() {
    const p = this.p;
    const n = this.stops.length;
    const at = stopAt(p, n);
    // the overview distance fits the whole town round the factory beside the card; stops come in closer
    const over = Math.min(1900, Math.max(640, 200 / (0.17 * this.camera.aspect)));
    let a, b, e;
    if (at.intro) { a = this.#focus(-1); b = a; e = 0; }
    else if (at.outro) { a = this.#focus(n - 1); b = this.#focus(-1); e = smooth(span(p, 1 - OUTRO, 1)); }
    else { a = this.#focus(at.i - 1); b = this.#focus(at.i); e = smooth(span(at.u, 0.04, 0.6)); }
    this.target.lerpVectors(a.t, b.t, e);
    const R = over * lerp(a.k, b.k, e);
    const el = THREE.MathUtils.degToRad(lerp(a.k === 1 ? 50 : 44, b.k === 1 ? 50 : 44, e));
    const az = THREE.MathUtils.degToRad(30);
    this.camera.position.set(this.target.x + R * Math.cos(el) * Math.sin(az), R * Math.sin(el), this.target.z + R * Math.cos(el) * Math.cos(az));
    this.camera.lookAt(this.target);

    // each stop: pack at the dock → the cartons make their way down the lane → stack at the door → colour
    const P = new THREE.Vector3();
    const T = new THREE.Vector3();
    this.stops.forEach((s, k) => {
      const u = (p - stopStart(k, n)) / at.w;
      const packIn = k === 0 ? span(p, 0.015, INTRO) : span(u, -0.08, 0.12);
      let lead = 0;
      s.cartons.forEach((c, j) => {
        const pop = backOut(clamp01(packIn * 1.4 - j * 0.2));
        c.visible = pop > 0.002;
        if (!c.visible) return;
        c.scale.setScalar(Math.max(0.0001, pop));
        // they leave one after another and keep their spacing: the lead is j = 0, at the front
        const go = smooth(span(u, 0.16 + j * 0.025, 0.7 + j * 0.025));
        const d = (2 - j) * GAP + go * (s.len - 2 * GAP);
        if (j === 0 && go > 0) lead = d;
        const t = clamp01(d / s.len);
        s.curve.getPointAt(t, P);
        s.curve.getTangentAt(t, T);
        const heading = Math.atan2(-T.z, T.x);
        const ph = go * s.hops; // whole hops, so they set down at the dock and at the door
        const land = smooth(span(u, 0.72 + j * 0.045, 0.79 + j * 0.045));
        if (land <= 0) {
          c.position.set(P.x, CY + HOP * Math.abs(Math.sin(Math.PI * ph)), P.z);
          c.rotation.set(0, heading, 0.08 * Math.sin(2 * Math.PI * ph));
        } else {
          // a last hop off the drive onto the stack
          const q = s.slots[j];
          c.position.set(lerp(P.x, q.x, land), lerp(CY, q.y, land) + Math.sin(Math.PI * land) * 4.5, lerp(P.z, q.z, land));
          c.rotation.set(0, turn(heading, s.yaw, land), 0);
        }
      });
      s.trail.mesh.geometry.setDrawRange(0, Math.floor(s.trail.quads * (lead / s.len)) * 6);
      s.accent.color.copy(s.grey).lerp(s.color, span(u, 0.8, 0.94));
    });
  }

  // screen positions for the HTML pins over each building (call after a render)
  pins() {
    const v = new THREE.Vector3();
    return this.stops.map((s) => {
      v.set(s.at.x, s.top + 8, s.at.z).project(this.camera);
      return { id: s.id, x: ((v.x + 1) / 2) * this.w, y: ((1 - v.y) / 2) * this.h, on: v.z < 1 };
    });
  }

  // draws only when something changed; returns whether it drew
  frame() {
    if (!this.dirty) return false;
    this.#pose();
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    return true;
  }

  dispose() {
    this.renderer.dispose();
  }
}
