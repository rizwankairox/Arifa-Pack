import * as THREE from 'three';
import { coilEndMap, cardboardMap } from '@/three/parts/textures';
import { logoImage, LOGO_ASPECT } from '@/three/parts/markTexture';

/*
  The hero's rolls and cutlery: Aluminium Foil, Cling Film and Cutlery.
  Unlike the drawn aluminium parts (heroShapes.js), these are built as real objects,
  read off the catalogue photographs:
    · foil  — a rolled-foil roll on its cardboard core, a crumpled sheet pulled out
              across the floor, the green Arifa carton behind it
    · film  — the pale, glossy cling-film roll, a sheet of clear film, the teal carton
    · cutlery — heavy-duty knife, fork and spoon in clear, black and white plastic,
              moulded with rounded edges, laid side by side
  Each is returned standing on y = 0, centred on its footprint, about as wide as the
  other parts on the ring.
*/

const FOOTPRINT = 1.15; // half-width every prop is scaled to (the aluminium parts are ~1.18)

// ─────────────────────────────────────────────────────────────────────────
// Carton artwork, painted on canvas (the logo is the nav's own SVG)
// ─────────────────────────────────────────────────────────────────────────
const ART = {
  foil: {
    ground: '#f4f4f1', panel: ['#22843f', '#0b5628'], title: 'Aluminium Foil', titleInk: '#0f5a2c',
    tag: 'HEAVY DUTY', tagInk: '#1b1b1b', tagFill: '#f2c230', sub: '30 CM  ·  FOOD GRADE  ·  MADE IN U.A.E', subInk: '#6a746d',
  },
  film: {
    ground: null, panel: ['#13716a', '#093b37'], title: 'CLING FILM', titleInk: '#ffffff',
    tag: 'EXTRA PREMIUM', tagInk: '#093b37', tagFill: '#f6d76b', sub: 'FREEZING  ·  STORING  ·  WRAPPING', subInk: '#bfe0da',
  },
};

function canvasTexture(w, h, paint, withLogo = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  paint(g, null);
  if (withLogo) {
    logoImage({ ink: '#ffffff', width: 1200 })
      .then((img) => { if (img) { paint(g, img); t.needsUpdate = true; } })
      .catch(() => {});
  }
  return t;
}

const panelGradient = (g, a, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, a.panel[0]);
  grad.addColorStop(1, a.panel[1]);
  return grad;
};

// the long front of the carton
function frontArt(kind) {
  const a = ART[kind];
  const W = 2048, H = 410;
  return canvasTexture(W, H, (g, logo) => {
    if (a.ground) {
      // white carton, fine silver pinstripes, the brand panel cut on a slant at the left
      g.fillStyle = a.ground;
      g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(140,150,160,0.10)';
      g.lineWidth = 6;
      for (let x = -H; x < W; x += 38) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); }
      g.fillStyle = panelGradient(g, a, H);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.34, 0); g.lineTo(W * 0.29, H); g.lineTo(0, H); g.closePath(); g.fill();
    } else {
      g.fillStyle = panelGradient(g, a, H);
      g.fillRect(0, 0, W, H);
      const sheen = g.createLinearGradient(0, 0, W, 0);
      sheen.addColorStop(0, 'rgba(255,255,255,0)'); sheen.addColorStop(0.55, 'rgba(255,255,255,0.08)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sheen;
      g.fillRect(0, 0, W, H);
    }
    if (logo) { const lh = H * 0.56; g.drawImage(logo, 70, H * 0.1, lh * LOGO_ASPECT, lh); }
    // set high on the panel: the roll in front hides the foot of the carton from above
    const x0 = W * 0.38;
    g.textBaseline = 'alphabetic';
    g.fillStyle = a.titleInk;
    g.font = `800 ${Math.round(H * 0.31)}px Archivo, "Helvetica Neue", Arial, sans-serif`;
    g.fillText(a.title, x0, H * 0.42);
    g.font = `600 ${Math.round(H * 0.07)}px "IBM Plex Mono", monospace`;
    const tw = g.measureText(a.tag).width + 44, ty = H * 0.5, th = H * 0.13;
    g.fillStyle = a.tagFill;
    g.beginPath(); g.roundRect(x0, ty, tw, th, 10); g.fill();
    g.fillStyle = a.tagInk;
    g.fillText(a.tag, x0 + 22, ty + th * 0.7);
    g.fillStyle = a.subInk;
    g.font = `500 ${Math.round(H * 0.06)}px "IBM Plex Mono", monospace`;
    g.fillText(a.sub, x0 + tw + 34, ty + th * 0.68);
    // printed carton: a touch darker toward the folds
    const e = g.createLinearGradient(0, 0, 0, H);
    e.addColorStop(0, 'rgba(0,0,0,0.10)'); e.addColorStop(0.12, 'rgba(0,0,0,0)'); e.addColorStop(0.86, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,0.16)');
    g.fillStyle = e;
    g.fillRect(0, 0, W, H);
  });
}

// the lid: brand colour, the tear strip and a line of small print
function topArt(kind) {
  const a = ART[kind];
  const W = 2048, H = 410;
  return canvasTexture(W, H, (g) => {
    g.fillStyle = a.ground || panelGradient(g, a, H);
    g.fillRect(0, 0, W, H);
    if (a.ground) { g.fillStyle = panelGradient(g, a, H); g.fillRect(0, H * 0.62, W, H * 0.38); }
    g.setLineDash([18, 12]);
    g.strokeStyle = a.ground ? 'rgba(15,90,44,0.45)' : 'rgba(255,255,255,0.35)';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(40, H * 0.3); g.lineTo(W - 40, H * 0.3); g.stroke();
    g.setLineDash([]);
    g.font = `600 ${Math.round(H * 0.08)}px "IBM Plex Mono", monospace`;
    g.fillStyle = a.ground ? 'rgba(15,90,44,0.7)' : 'rgba(255,255,255,0.55)';
    g.fillText(`ARIFA PACK  ·  ${a.title.toUpperCase()}  ·  TEAR HERE`, 60, H * 0.22);
  }, false);
}

// the short ends: brand colour with the mark
function endArt(kind) {
  const a = ART[kind];
  const S = 410;
  return canvasTexture(S, S, (g, logo) => {
    g.fillStyle = panelGradient(g, a, S);
    g.fillRect(0, 0, S, S);
    if (logo) { const lw = S * 0.78; g.drawImage(logo, (S - lw) / 2, (S - lw / LOGO_ASPECT) / 2, lw, lw / LOGO_ASPECT); }
  });
}

function carton(kind, L, h, d) {
  const printed = (map) => new THREE.MeshPhysicalMaterial({ map, roughness: 0.44, clearcoat: 0.45, clearcoatRoughness: 0.28, envMapIntensity: 0.7 });
  const front = printed(frontArt(kind));
  const top = printed(topArt(kind));
  const end = printed(endArt(kind));
  const bottom = new THREE.MeshStandardMaterial({ color: '#b9a789', roughness: 0.9 });
  // BoxGeometry faces: +x, −x, +y, −y, +z (front, toward the camera), −z
  const box = new THREE.Mesh(new THREE.BoxGeometry(L, h, d), [end, end, top, bottom, front, top]);
  box.position.y = h / 2;
  return box;
}

// ─────────────────────────────────────────────────────────────────────────
// Rolls
// ─────────────────────────────────────────────────────────────────────────
function roll({ length, radius, core, wrap, face, cardboard }) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 120, 1, true), wrap);
  body.rotation.z = Math.PI / 2; // lying down, along x
  g.add(body);
  // the wound layers on each end, then the cardboard core
  const ends = new THREE.RingGeometry(core, radius, 120, 1);
  const lipGeo = new THREE.RingGeometry(core * 0.82, core, 64, 1);
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(ends, face);
    e.position.x = side * length / 2;
    e.rotation.y = side * Math.PI / 2;
    const lip = new THREE.Mesh(lipGeo, cardboard);
    lip.position.x = side * (length / 2 + 0.001);
    lip.rotation.y = side * Math.PI / 2;
    g.add(e, lip);
  }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(core * 0.82, core * 0.82, length, 64, 1, true), cardboard);
  tube.rotation.z = Math.PI / 2;
  g.add(tube);
  return g;
}

// the free end of the roll, drawn out across the floor: rippled, its edge lifting
function sheetGeometry(width, len) {
  const geo = new THREE.PlaneGeometry(width, len, 32, 40);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const v = p.getY(i) / len + 0.5; // 0 under the roll → 1 at the free edge
    const ripple = (Math.sin(v * 11 + x * 2.3) * 0.014 + Math.sin(x * 7.1 + v * 5) * 0.007) * v;
    const curl = v > 0.7 ? ((v - 0.7) / 0.3) ** 2 * 0.1 : 0;
    p.setXYZ(i, x, 0.004 + Math.max(0, ripple) + curl, v * len);
  }
  geo.computeVertexNormals();
  return geo;
}

function rollProp(kind, { maps, crinkle, lowPower }) {
  const foil = kind === 'foil';
  const L = 2.3, h = 0.46, d = 0.46;
  const radius = foil ? 0.2 : 0.215, core = foil ? 0.085 : 0.09, length = 2.02;
  const cardboard = new THREE.MeshStandardMaterial({ map: cardboardMap(), roughness: 0.92, side: THREE.DoubleSide });

  // rolled aluminium: bright, with the rolling marks running round the roll
  const wrap = foil
    ? new THREE.MeshPhysicalMaterial({
      color: '#e8ebee', metalness: 1, roughness: 0.5, roughnessMap: maps.roughness,
      normalMap: maps.normal, normalScale: new THREE.Vector2(0.16, 0.16), anisotropy: lowPower ? 0 : 0.7, envMapIntensity: 1.35,
    })
    // cling film: many layers of thin film read as a pale, waxy, glossy yellow
    : new THREE.MeshPhysicalMaterial({
      color: '#eadc9a', metalness: 0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05,
      sheen: 0.6, sheenColor: new THREE.Color('#fff7d6'), sheenRoughness: 0.35,
      normalMap: maps.normal, normalScale: new THREE.Vector2(0.05, 0.05), envMapIntensity: 1.1,
    });
  const face = new THREE.MeshPhysicalMaterial({
    map: coilEndMap(core / radius), color: foil ? '#ffffff' : '#f3e6a6',
    metalness: foil ? 0.9 : 0, roughness: foil ? 0.35 : 0.3, clearcoat: foil ? 0 : 0.6, envMapIntensity: 1.1,
  });
  const sheet = foil
    ? new THREE.MeshPhysicalMaterial({
      color: '#e4e7ea', metalness: 1, roughness: 0.3, side: THREE.DoubleSide,
      normalMap: crinkle.normal, normalScale: new THREE.Vector2(0.75, 0.75), envMapIntensity: 1.4,
    })
    // clear film: nearly invisible but for its wrinkles catching the light
    : new THREE.MeshPhysicalMaterial({
      color: '#f6f9fa', metalness: 0, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.3, depthWrite: false,
      side: THREE.DoubleSide, normalMap: crinkle.normal, normalScale: new THREE.Vector2(0.45, 0.45), envMapIntensity: 1.7,
    });

  const g = new THREE.Group();
  const box = carton(kind, L, h, d);
  box.position.z = -0.36;
  g.add(box);
  const r = roll({ length, radius, core, wrap, face, cardboard });
  // far enough in front that, seen from above, it hides only the foot of the carton's print
  r.position.set(0.07, radius + 0.001, 0.32);
  r.rotation.y = -0.05;
  g.add(r);
  if (foil) {
    // the paper band round the middle of the roll
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(radius + 0.003, radius + 0.003, 0.12, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: '#cfe6c3', roughness: 0.7, transparent: true, opacity: 0.92 }),
    );
    band.rotation.z = Math.PI / 2;
    band.position.x = 0.18;
    r.add(band);
  }
  const s = new THREE.Mesh(sheetGeometry(length * 0.97, 0.66), sheet);
  s.position.set(0.07, 0, 0.3);
  s.rotation.y = -0.05;
  g.add(s);
  return fit(g);
}

// ─────────────────────────────────────────────────────────────────────────
// Cutlery — moulded, not cut out
// ─────────────────────────────────────────────────────────────────────────
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/*
  A moulded piece: a rounded section (a squared-off ellipse, like an injection-moulded
  edge) swept along the length. One closed, indexed surface, so it shades smoothly —
  no facets — and it closes to a point at both ends.
    edges(u)      → [zLow, zHigh]: the piece's two side edges at u along its length
    thick(u)      → thickness
    centre(u, z)  → height of the mid-surface (arch along the handle, the spoon's dish, …)
    ridge(u, v)   → extra height on the top face only (the spine down a handle)
*/
function moulded({ L, edges, thick, centre, ridge = (_u: number, _v: number): number => 0, n = 240, m = 32, p = 3.2 }) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * L;
    const [zb, zt] = edges(u);
    const zc = (zb + zt) / 2, hz = Math.max(0, (zt - zb) / 2);
    const th = (thick(u) / 2) * Math.sqrt(clamp01(hz / 0.025)); // closes up at the tips
    for (let j = 0; j < m; j++) {
      const s = (j / m) * Math.PI * 2;
      const c = Math.cos(s), sn = Math.sin(s);
      const v = Math.sign(c) * Math.abs(c) ** (2 / p);
      const w = Math.sign(sn) * Math.abs(sn) ** (2 / p);
      const z = zc + hz * v;
      let y = centre(u, z) + th * w;
      if (w > 0) y += ridge(u, v) * w;
      pos.push(u, y, z);
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const a = i * m + j, b = i * m + ((j + 1) % m), c = (i + 1) * m + j, d = (i + 1) * m + ((j + 1) % m);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// handle shared by all three: rounded end, widest near the end, tapering to the neck
const HANDLE_END = 1.1;
const handleW = (u, w0 = 0.1, w1 = 0.058) => {
  if (u < 0.12) return w0 * Math.sqrt(clamp01(1 - ((0.12 - u) / 0.12) ** 2));
  return w0 + (w1 - w0) * smooth(0.12, HANDLE_END, u);
};
const arch = (u, L) => 0.04 * Math.sin((Math.PI * Math.min(Math.max(u, 0), L)) / L); // the gentle bow along its length
const spine = (u, v) => 0.007 * (1 - smooth(0.85, 1.15, u)) * smooth(0.1, 0.3, u) * Math.max(0, 1 - v * v) ** 2;
const handleThick = (u) => 0.05 - 0.012 * smooth(0.6, 1.25, u);

function knife(mat) {
  const L = 2.14;
  const back = (u) => {
    if (u < HANDLE_END) return handleW(u);
    if (u < 1.9) return 0.058 + 0.016 * smooth(1.1, 1.32, u);
    return 0.074 * Math.sqrt(clamp01(1 - ((u - 1.9) / 0.24) ** 2));
  };
  const edge = (u) => {
    if (u < HANDLE_END) return -handleW(u);
    const w = 0.058 + 0.046 * smooth(1.1, 1.4, u);
    const tip = u > 1.42 ? Math.sqrt(clamp01(1 - ((u - 1.42) / 0.72) ** 2)) : 1;
    const teeth = u > 1.48 && u < 1.98 ? 0.0065 * Math.abs(Math.sin(u * 96)) : 0; // the serrations
    return -w * tip + teeth;
  };
  const geo = moulded({
    L, edges: (u) => [edge(u), back(u)],
    thick: (u) => (u < HANDLE_END ? handleThick(u) : 0.036 - 0.01 * smooth(1.3, 2.1, u)),
    centre: (u) => arch(u, L), ridge: spine, n: 300,
  });
  return new THREE.Mesh(geo, mat);
}

function fork(mat) {
  const L = 2.07;
  const g = new THREE.Group();
  const lift = (u) => arch(u, L) + 0.055 * smooth(1.45, 2.07, u) ** 2; // the head turns up a little
  // handle, neck and the head, rounded off where the slots between the tines begin
  const hw = (u) => {
    if (u < HANDLE_END) return handleW(u);
    const neck = 0.058 + 0.112 * smooth(1.1, 1.46, u);
    return u > 1.56 ? 0.17 * Math.sqrt(clamp01(1 - ((u - 1.56) / 0.1) ** 2)) : neck;
  };
  g.add(new THREE.Mesh(moulded({
    L: 1.66, edges: (u) => [-hw(u), hw(u)],
    thick: (u) => (u < HANDLE_END ? handleThick(u) : 0.036), centre: lift, ridge: spine, n: 220,
  }), mat));
  // four tines, tapering to rounded points
  [-0.128, -0.043, 0.043, 0.128].forEach((c) => {
    const t0 = 1.5;
    const w = (u) => {
      const start = Math.sqrt(clamp01((u - t0) / 0.03)); // rounded, inside the head
      const tip = u > L - 0.035 ? Math.sqrt(clamp01(1 - ((u - (L - 0.035)) / 0.035) ** 2)) : 1;
      return (0.031 - 0.009 * smooth(1.62, L, u)) * start * tip;
    };
    const geo = moulded({ L: L - t0, edges: (k) => [c - w(k + t0), c + w(k + t0)], thick: () => 0.032, centre: (k) => lift(k + t0), n: 90, m: 20 });
    geo.translate(t0, 0, 0);
    g.add(new THREE.Mesh(geo, mat));
  });
  return g;
}

function spoon(mat) {
  const L = 2.07, cx = 1.68, a = 0.39, b = 0.21, depth = 0.085;
  const hw = (u) => {
    if (u < HANDLE_END) return handleW(u, 0.1, 0.054);
    const neck = 0.054 + 0.02 * smooth(1.1, 1.3, u);
    const bowl = b * Math.sqrt(clamp01(1 - ((u - cx) / a) ** 2));
    return Math.max(u < cx ? neck : 0, bowl);
  };
  // the bowl is a real dish: both faces sink together, so the wall keeps its thickness
  const dish = (u, z) => { const r2 = ((u - cx) / a) ** 2 + (z / b) ** 2; return r2 < 1 ? depth * (1 - r2) ** 1.15 : 0; };
  const geo = moulded({
    L, edges: (u) => [-hw(u), hw(u)],
    thick: (u) => (u < HANDLE_END ? handleThick(u) : 0.034 - 0.012 * smooth(1.25, 1.5, u)),
    centre: (u, z) => arch(u, L) + 0.03 * smooth(1.2, 1.5, u) - dish(u, z), ridge: spine, n: 300, m: 40,
  });
  return new THREE.Mesh(geo, mat);
}

function cutleryProp({ lowPower }) {
  // deep black, polished: it glints, it never turns grey
  const black = new THREE.MeshPhysicalMaterial({ color: '#040405', roughness: 0.16, metalness: 0, specularIntensity: 0.55, envMapIntensity: 0.8 });
  // warm white polystyrene, a little satin
  const white = new THREE.MeshPhysicalMaterial({ color: '#f2f1ec', roughness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.2, sheen: 0.25, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.9 });
  // clear polystyrene: refracts what is behind it (cheaper see-through on low-power devices)
  const clear = lowPower
    ? new THREE.MeshPhysicalMaterial({ color: '#f4f8fb', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.42, depthWrite: false, envMapIntensity: 1.8 })
    : new THREE.MeshPhysicalMaterial({
      color: '#ffffff', roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.05, ior: 1.59,
      attenuationColor: new THREE.Color('#e9f1f4'), attenuationDistance: 0.6, specularIntensity: 1, envMapIntensity: 1.4,
    });
  // laid side by side, as in a product shot: knife, fork, spoon, each a touch off true
  const set = new THREE.Group();
  ([[knife(clear), -0.5, 0.02, 0.05], [fork(black), 0, -0.04, -0.03], [spoon(white), 0.5, 0.0, 0.04]] as [THREE.Object3D, number, number, number][]).forEach(([piece, z, x, turn]) => {
    piece.position.set(x - 1.04, 0, z);
    piece.rotation.y = turn;
    set.add(piece);
  });
  const g = new THREE.Group();
  g.add(set);
  return fit(g, FOOTPRINT * 1.12);
}

// centre on the footprint, scale to the ring's part size, stand on y = 0
function fit(object, footprint = FOOTPRINT) {
  const wrap = new THREE.Group();
  wrap.add(object);
  wrap.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(object);
  const half = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
  const k = footprint / half;
  object.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  wrap.scale.setScalar(k);
  return { object: wrap, height: (bb.max.y - bb.min.y) * k };
}

export function buildHeroProp(key, ctx) {
  if (key === 'foil' || key === 'film') return rollProp(key, ctx);
  if (key === 'cutlery') return cutleryProp(ctx);
  return null;
}
