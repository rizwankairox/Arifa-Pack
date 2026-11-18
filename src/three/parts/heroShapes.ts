import * as THREE from 'three';
import { DIM, buildProfile, buildPerimeter, smooth, gauss } from '@/three/parts/containerGeometry';

/*
  Every product in the hero shares ONE vertex grid — rings of the base, then rows up
  the wall profile, around a closed outline — so vertex i of the container and
  vertex i of the pot are "the same particle". The transition uses exactly that:
  the part breaks into its vertices, they swirl, and land on the next part.

  Rows follow buildProfile() (fixed segment counts), columns follow buildPerimeter()
  (fixed sample counts), so the vertex count never changes between shapes.
*/

const BASE_RINGS = 18;
const R_FORMED = 1.18; // every product is scaled to about this footprint radius

const REF = buildPerimeter(DIM); // the reference outline fixes the column count
const COLS = REF.length;
const START = Math.atan2(REF[0].z, REF[0].x);

function rectOutline(D) {
  return buildPerimeter(D).map((p) => ({ x: p.x, z: p.z, nx: p.nx, nz: p.nz, cw: p.cw, ph: p.u }));
}
function ovalOutline(a, b) {
  return Array.from({ length: COLS }, (_, i) => {
    const t = START + (i / COLS) * Math.PI * 2;
    const x = a * Math.cos(t), z = b * Math.sin(t);
    let nx = x / (a * a), nz = z / (b * b);
    const l = Math.hypot(nx, nz);
    return { x, z, nx: nx / l, nz: nz / l, cw: 1, ph: i / COLS };
  });
}

// ── the products (proportions read off the catalogue photos) ────────────────
// floors keep a flat centre (k < 0.55) where the ARIFA PACK mark is stamped
const SPECS = {
  container: {
    D: {}, outline: rectOutline, pleats: DIM.pleats, sharp: 1,
    ribs: (k) => 0.014 * gauss(k, 0.84, 0.028) + 0.009 * gauss(k, 0.64, 0.024) - 0.004 * gauss(k, 0.74, 0.05),
  },
  platter: {
    size: 1.14,
    D: { a0: 1.25, b0: 0.9, flare: THREE.MathUtils.degToRad(40), rf1: 0.05, wall: 0.24, rf2: 0.04, flange: 0.17, rc: 0.026, pleatAmp: 0.008 },
    outline: (D) => ovalOutline(D.a0, D.b0), pleats: 84, sharp: 1,
    ribs: (k) => 0.012 * gauss(k, 0.92, 0.02) + 0.01 * gauss(k, 0.78, 0.02) + 0.008 * gauss(k, 0.64, 0.02),
  },
  pot: {
    D: { a0: 0.8, b0: 0.8, flare: THREE.MathUtils.degToRad(11), rf1: 0.06, wall: 0.6, rf2: 0.03, flange: 0.08, rc: 0.026, pleatAmp: 0.011 },
    outline: (D) => ovalOutline(D.a0, D.b0), pleats: 72, sharp: 1,
    ribs: (k) => 0.012 * gauss(k, 0.82, 0.03) + 0.008 * gauss(k, 0.66, 0.025),
  },
  cup: {
    size: 0.52, // a small baking cup: well under the pot
    D: { a0: 0.5, b0: 0.5, flare: THREE.MathUtils.degToRad(12), rf1: 0.045, wall: 0.62, rf2: 0.025, flange: 0.06, rc: 0.02, pleatAmp: 0.012 },
    outline: (D) => ovalOutline(D.a0, D.b0), pleats: 52, sharp: 1,
    ribs: (k) => 0.01 * gauss(k, 0.74, 0.04),
  },
  microwave: {
    D: { a0: 0.92, b0: 0.64, r0: 0.24, flare: THREE.MathUtils.degToRad(7), rf1: 0.08, wall: 0.5, rf2: 0.03, flange: 0.1, rc: 0.02, curl: Math.PI * 0.5, pleatAmp: 0 },
    outline: rectOutline, pleats: 0, sharp: 1,
    ribs: (k) => 0.01 * gauss(k, 0.72, 0.03), // one moulded ring round the base
  },
};
const SHAPES = Object.keys(SPECS);

function rowsFor(prof) {
  const rows = [];
  for (let i = 0; i <= BASE_RINGS; i++) rows.push({ kind: 'base', k: i / BASE_RINGS });
  for (let i = 1; i < prof.rows.length; i++) rows.push({ kind: 'wall', p: prof.rows[i] });
  return rows;
}

function buildShape(spec) {
  const D = { ...DIM, ...spec.D };
  const prof = buildProfile(D);
  const outline = spec.outline(D);
  const rows = rowsFor(prof);
  const nv = rows.length * COLS;
  const pos = new Float32Array(nv * 3);

  rows.forEach((row, ri) => {
    outline.forEach((P, ci) => {
      const v = ri * COLS + ci;
      if (row.kind === 'base') {
        const k = row.k;
        pos.set([P.x * k, spec.ribs(k), P.z * k], v * 3);
        return;
      }
      const { s, n, h } = row.p;
      // surplus metal (blank perimeter − drawn perimeter) gathers into pleats
      const surplus = Math.max(0, s - n);
      const amp = D.pleatAmp * P.cw * smooth(0, 0.22, surplus);
      let pleat = 0;
      if (amp > 0) {
        const w = Math.sin(P.ph * Math.PI * 2 * spec.pleats);
        pleat = amp * Math.sign(w) * Math.pow(Math.abs(w), spec.sharp);
      }
      const d = n + pleat;
      pos.set([P.x + P.nx * d, h + pleat * 0.25, P.z + P.nz * d], v * 3);
    });
  });

  // common footprint; rest on the floor (y = 0)
  let r = 0;
  for (let i = 0; i < nv * 3; i += 3) r = Math.max(r, Math.hypot(pos[i], pos[i + 2]));
  const sf = (R_FORMED * (spec.size || 1)) / r;
  for (let i = 0; i < nv * 3; i++) pos[i] *= sf;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < nv * 3; i += 3) minY = Math.min(minY, pos[i]);
  for (let i = 1; i < nv * 3; i += 3) { pos[i] -= minY; maxY = Math.max(maxY, pos[i]); }

  // the flat middle of the floor, where the mark goes
  const mid = Math.round(BASE_RINGS * 0.55) * COLS;
  let hx = 0, hz = 0;
  for (let c = 0; c < COLS; c++) { hx = Math.max(hx, Math.abs(pos[(mid + c) * 3])); hz = Math.max(hz, Math.abs(pos[(mid + c) * 3 + 2])); }
  return { rows: rows.length, pos, height: maxY, floor: { y: pos[1], hx, hz } };
}

function normalsOf(pos, index) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return new Float32Array(g.getAttribute('normal').array);
}

export function buildHeroShapes() {
  const built: Record<string, any> = {};
  SHAPES.forEach((k) => (built[k] = buildShape(SPECS[k])));
  const rows = built.container.rows;
  const nv = rows * COLS;

  const index = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      const c1 = (c + 1) % COLS;
      const a = r * COLS + c, b = r * COLS + c1, d = (r + 1) * COLS + c, e = (r + 1) * COLS + c1;
      index.push(a, d, b, b, d, e);
    }
  }
  // one winding for every shape: the container floor must face +y
  if (normalsOf(built.container.pos, index)[3 * COLS * 3 + 1] < 0) {
    for (let i = 0; i < index.length; i += 3) { const t = index[i + 1]; index[i + 1] = index[i + 2]; index[i + 2] = t; }
  }

  const shapes: Record<string, any> = {};
  SHAPES.forEach((k) => {
    const b = built[k];
    shapes[k] = { pos: b.pos, nrm: normalsOf(b.pos, index), height: b.height, floor: b.floor };
  });

  // planar UVs off the container footprint, so the brushing runs one way
  const cp = shapes.container.pos;
  let mx = 0, mz = 0;
  for (let i = 0; i < nv; i++) { mx = Math.max(mx, Math.abs(cp[i * 3])); mz = Math.max(mz, Math.abs(cp[i * 3 + 2])); }
  const uv = new Float32Array(nv * 2);
  for (let i = 0; i < nv; i++) uv.set([cp[i * 3] / (mx * 2) + 0.5, cp[i * 3 + 2] / (mz * 2) + 0.5], i * 2);

  return { count: nv, rows, cols: COLS, index, shapes, uv };
}
