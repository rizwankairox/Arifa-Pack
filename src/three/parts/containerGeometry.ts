import * as THREE from 'three';

/*
  Procedural aluminium food container (rectangular, curled rim) built so a single
  mesh can morph from the flat blank cut off the coil to the drawn container.

  Every vertex lives on an offset of the rounded-rectangle base outline:
      P(t, d) = P0(t) + d · N(t)
  The blank keeps d = arc length s along the wall profile (flat sheet).
  The drawn container maps the same s through a 2D profile curve (n(s), h(s)).
  At the corners n(s) < s, i.e. the drawn part has less perimeter than the blank —
  that surplus metal is what folds into the pleats, so pleat amplitude follows it.
*/

export const DIM = {
  a0: 0.95,      // half length of the base
  b0: 0.62,      // half width of the base
  r0: 0.17,      // base corner radius
  flare: THREE.MathUtils.degToRad(14), // wall flare from vertical
  rf1: 0.05,     // base → wall fillet
  wall: 0.46,    // straight wall length
  rf2: 0.03,     // wall → flange fillet
  flange: 0.075, // flat flange
  rc: 0.024,     // curl radius
  curl: Math.PI * 1.55,
  pleats: 8,     // pleats per corner
  pleatAmp: 0.02,
};

// ── wall profile, integrated from piecewise curvature ────────────────────────
export function buildProfile(D) {
  const aw = Math.PI / 2 - D.flare;
  const segs = [
    { len: D.rf1 * aw, k: 1 / D.rf1, n: 8 },
    { len: D.wall, k: 0, n: 16 },
    { len: D.rf2 * aw, k: -1 / D.rf2, n: 6 },
    { len: D.flange, k: 0, n: 7 },
    { len: D.rc * D.curl, k: -1 / D.rc, n: 22 },
  ];
  const out = [{ s: 0, n: 0, h: 0, seg: 0 }];
  let s = 0, a = 0, x = 0, y = 0;
  const sub = 40;
  segs.forEach((g, gi) => {
    const ds = g.len / (g.n * sub);
    for (let i = 0; i < g.n; i++) {
      for (let j = 0; j < sub; j++) {
        const am = a + g.k * ds * 0.5;
        x += Math.cos(am) * ds;
        y += Math.sin(am) * ds;
        a += g.k * ds;
        s += ds;
      }
      out.push({ s, n: x, h: y, seg: gi });
    }
  });
  // flange height (end of 2nd fillet) becomes y = 0 when drawn
  const flangeRow = out.findIndex((p) => p.seg === 3);
  const top = out[flangeRow].h;
  const flangeEnd = out.filter((p) => p.seg === 3).pop();
  return { rows: out, total: s, top, flangeN: flangeEnd.n, wallTopN: out[flangeRow].n };
}

// ── rounded-rect perimeter samples ──────────────────────────────────────────
export function buildPerimeter(D, perCorner = 40, longEdge = 24, shortEdge = 16) {
  const { a0, b0, r0 } = D;
  const ax = a0 - r0, bz = b0 - r0;
  const pts = [];
  const corners = [
    { cx: ax, cz: bz, start: 0 },
    { cx: -ax, cz: bz, start: Math.PI / 2 },
    { cx: -ax, cz: -bz, start: Math.PI },
    { cx: ax, cz: -bz, start: Math.PI * 1.5 },
  ];
  // walk CCW (viewed from +y): right edge → corner → top edge …
  const edge = (x0, z0, x1, z1, nx, nz, count) => {
    for (let i = 0; i < count; i++) {
      const t = i / count;
      pts.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, nx, nz, cw: 0, u: 0 });
    }
  };
  const corner = (c, count) => {
    for (let i = 0; i < count; i++) {
      const u = i / count;
      const phi = c.start + u * Math.PI / 2;
      const nx = Math.cos(phi), nz = Math.sin(phi);
      // flat-topped weight so pleats fill the corner but fade into the straight walls
      const cw = smooth(0, 0.16, u) * (1 - smooth(0.84, 1, u));
      pts.push({ x: c.cx + r0 * nx, z: c.cz + r0 * nz, nx, nz, cw, u });
    }
  };
  edge(a0, -bz, a0, bz, 1, 0, shortEdge);
  corner(corners[0], perCorner);
  edge(ax, b0, -ax, b0, 0, 1, longEdge);
  corner(corners[1], perCorner);
  edge(-a0, bz, -a0, -bz, -1, 0, shortEdge);
  corner(corners[2], perCorner);
  edge(-ax, -b0, ax, -b0, 0, -1, longEdge);
  corner(corners[3], perCorner);
  return pts;
}

// Computes vertex normals; if the probe vertex (on a flat, upward region) ends up
// pointing down, reverses every triangle in-place and recomputes.
function normalsFacingUp(positions, index, probe) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  if (g.getAttribute('normal').array[probe * 3 + 1] < 0) {
    for (let i = 0; i < index.length; i += 3) {
      const t = index[i + 1]; index[i + 1] = index[i + 2]; index[i + 2] = t;
    }
    g.setIndex(index);
    g.computeVertexNormals();
  }
  return new Float32Array(g.getAttribute('normal').array);
}

export function smooth(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
export const gauss = (x, mu, sig) => Math.exp(-((x - mu) ** 2) / (2 * sig * sig));

// ── container ───────────────────────────────────────────────────────────────
export function buildContainer(D = DIM) {
  const prof = buildProfile(D);
  const perim = buildPerimeter(D);
  const cols = perim.length;

  const baseRings = 18;
  const rows = [];
  for (let i = 0; i <= baseRings; i++) rows.push({ kind: 'base', k: i / baseRings });
  for (let i = 1; i < prof.rows.length; i++) rows.push({ kind: 'wall', p: prof.rows[i] });

  const nv = rows.length * cols;
  const flat = new Float32Array(nv * 3);
  const formed = new Float32Array(nv * 3);
  const uv = new Float32Array(nv * 2);
  const seq = new Float32Array(nv);

  const blankA = D.a0 + prof.total, blankB = D.b0 + prof.total;
  const pleatTau = Math.PI * 2 * D.pleats;

  rows.forEach((row, ri) => {
    for (let ci = 0; ci < cols; ci++) {
      const P = perim[ci];
      const v = ri * cols + ci;
      let fx, fz, ox, oy, oz, sq;
      if (row.kind === 'base') {
        const k = row.k;
        fx = P.x * k; fz = P.z * k;
        // stamped ribs in the base, concentric with the outline
        const rib = 0.014 * gauss(k, 0.84, 0.028) + 0.009 * gauss(k, 0.6, 0.024) - 0.004 * gauss(k, 0.72, 0.05);
        ox = fx; oz = fz; oy = -prof.top + rib;
        sq = 0;
      } else {
        const { s, n, h } = row.p;
        fx = P.x + P.nx * s; fz = P.z + P.nz * s;
        // surplus metal at the corners → pleats, growing up the wall
        const surplus = Math.max(0, s - n);
        const amp = D.pleatAmp * P.cw * smooth(0.0, 0.22, surplus);
        const w = Math.sin(P.u * pleatTau);
        const pleat = amp * Math.sign(w) * Math.pow(Math.abs(w), 0.65);
        const d = n + pleat;
        ox = P.x + P.nx * d; oz = P.z + P.nz * d;
        oy = h - prof.top + pleat * 0.25;
        sq = Math.min(1, s / prof.total);
      }
      flat.set([fx, 0, fz], v * 3);
      formed.set([ox, oy, oz], v * 3);
      // planar UVs from the blank: brushing direction follows the coil (x)
      uv.set([fx / (blankA * 2) + 0.5, fz / (blankB * 2) + 0.5], v * 2);
      seq[v] = sq;
    }
  });

  const index = [];
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const c1 = (c + 1) % cols;
      const a = r * cols + c, b = r * cols + c1;
      const d = (r + 1) * cols + c, e = (r + 1) * cols + c1;
      index.push(a, d, b, b, d, e);
    }
  }

  // normals of the drawn state — winding must face +y on the base, because
  // double-sided shading flips normals by gl_FrontFacing
  const formedN = normalsFacingUp(formed, index, cols * 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(flat, 3));
  geo.setAttribute('formedPos', new THREE.BufferAttribute(formed, 3));
  geo.setAttribute('formedNormal', new THREE.BufferAttribute(new Float32Array(formedN), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aSeq', new THREE.BufferAttribute(seq, 1));
  geo.setIndex(index);
  // bounds must cover both states
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(-blankA, -prof.top - 0.05, -blankB), new THREE.Vector3(blankA, 0.1, blankB));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -prof.top / 2, 0), Math.hypot(blankA, blankB) + 0.1);

  // static drawn copy (for the stack)
  const drawn = new THREE.BufferGeometry();
  drawn.setAttribute('position', new THREE.BufferAttribute(formed.slice(), 3));
  drawn.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(formedN), 3));
  drawn.setAttribute('uv', new THREE.BufferAttribute(uv.slice(), 2));
  drawn.setIndex(index);
  drawn.computeBoundingSphere();
  drawn.computeBoundingBox();

  return {
    geometry: geo,
    drawn,
    info: {
      height: prof.top,
      blankHalf: [blankA, blankB],
      blankRadius: D.r0 + prof.total,
      flangeHalf: [D.a0 + prof.flangeN, D.b0 + prof.flangeN],
      cavityHalf: [D.a0 + prof.wallTopN, D.b0 + prof.wallTopN],
      rimHalf: [D.a0 + prof.flangeN + D.rc, D.b0 + prof.flangeN + D.rc],
    },
  };
}

// ── lid: embossed panel with a skirt that folds over the curl ───────────────
export function buildLid(D = DIM, info) {
  const perim = buildPerimeter(D, 28, 18, 12);
  const cols = perim.length;
  const reach = info.rimHalf[0] - D.a0 + 0.012; // outline offset that covers the rim
  const rings = 34;
  const nv = (rings + 1) * cols;
  const pos = new Float32Array(nv * 3);
  const uv = new Float32Array(nv * 2);
  const ax = D.a0 + reach, bz = D.b0 + reach;

  for (let r = 0; r <= rings; r++) {
    const k = r / rings;
    for (let c = 0; c < cols; c++) {
      const P = perim[c];
      const v = r * cols + c;
      // outer 8% of the radius becomes the skirt
      const kk = Math.min(k / 0.92, 1);
      const x = (P.x + P.nx * reach) * kk;
      const z = (P.z + P.nz * reach) * kk;
      let y = 0;
      y += 0.016 * smooth(0.8, 0.74, kk);            // raised centre panel
      y -= 0.006 * gauss(kk, 0.88, 0.018);           // groove that seats on the rim
      const skirt = smooth(0.92, 1, k);
      const sx = x + P.nx * 0.008 * skirt, sz = z + P.nz * 0.008 * skirt;
      y -= 0.045 * skirt;
      pos.set([sx, y, sz], v * 3);
      uv.set([x / (ax * 2) + 0.5, 1 - (z / (bz * 2) + 0.5)], v * 2);
    }
  }
  const index = [];
  for (let r = 0; r < rings; r++) {
    for (let c = 0; c < cols; c++) {
      const c1 = (c + 1) % cols;
      const a = r * cols + c, b = r * cols + c1, d = (r + 1) * cols + c, e = (r + 1) * cols + c1;
      index.push(a, d, b, b, d, e);
    }
  }
  // probe: a vertex on the flat centre panel (ring 4)
  const normals = normalsFacingUp(pos, index, 4 * cols);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeTangents();
  return { geometry: geo, half: [ax, bz] };
}
