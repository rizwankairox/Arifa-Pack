import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/*
  The Arifa factory in Al Jurf, Ajman, as a clean model in brand blue: three sheds, the corner office
  block with the company band, the rooftop logo sign, parking and white trees. Shared by the About
  page's reach scene and the Clients page's delivery scene.
*/

const FACTORY_COL = {
  body: 0x2f5ad6,
  roof: 0x5d84ec,
  deep: 0x18388f,
  glass: 0x12307e,
  door: 0x9fb6f4,
  plot: 0xf1f4f8,
  line: 0xffffff,
  tree: 0xffffff,
  trunk: 0xc9d0db,
  car: 0xf7f8fa,
  carAlt: 0xd9dee7,
  carTop: 0xb4bfce,
};

export function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(s, 6);
}

// returns { group, mats, sign, office }; the group's footprint is centred on its origin.
// skipTree(x, z) (group coordinates) leaves out plot trees, e.g. to clear a gate.
export function buildArifaFactory({ skipTree = (_x: number, _z: number): boolean => false } = {}) {
  const g = new THREE.Group();
  const C = FACTORY_COL;
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const mat = {
    body: M(C.body), roof: M(C.roof), deep: M(C.deep), glass: M(C.glass), door: M(C.door),
    plot: M(C.plot), line: M(C.line), tree: M(C.tree, { flatShading: true }), trunk: M(C.trunk),
    car: M(C.car), carAlt: M(C.carAlt), carTop: M(C.carTop),
  };
  const add = (geo, m, x, y, z, { cast = true, parent = g } = {}) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // the plot
  const plot = new THREE.Mesh(roundedRect(84, 92, 5), mat.plot);
  plot.rotation.x = -Math.PI / 2;
  plot.position.set(6, 0.03, 8);
  plot.receiveShadow = true;
  g.add(plot);

  // three sheds side by side, gable roofs, a vent along each ridge
  const D = 46, WH = 9, BW = 15, RISE = 2.2;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-BW / 2 - 0.5, 0);
  roofShape.lineTo(BW / 2 + 0.5, 0);
  roofShape.lineTo(0, RISE);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: D + 1, bevelEnabled: false });
  roofGeo.translate(0, 0, -(D + 1) / 2);
  for (let i = 0; i < 3; i++) {
    const x = -16 + i * BW;
    add(new THREE.BoxGeometry(BW - 0.2, WH, D), mat.body, x, WH / 2, 0);
    add(roofGeo, mat.roof, x, WH, 0);
    add(new THREE.BoxGeometry(1.3, 0.7, D - 8), mat.deep, x, WH + RISE + 0.15, 0);
  }
  // loading doors on the front of the first two sheds, with a canopy
  for (const x of [-19, -12.5, -3]) add(new THREE.BoxGeometry(4.6, 6, 0.3), mat.door, x, 3, D / 2 + 0.12, { cast: false });
  add(new THREE.BoxGeometry(22, 0.35, 2.4), mat.deep, -11, 6.7, D / 2 + 1.2);
  // the long side: a strip of high windows and two doors
  add(new THREE.BoxGeometry(0.25, 1.3, 36), mat.glass, 21.6, 7.1, -3, { cast: false });
  for (const z of [-14, -2]) add(new THREE.BoxGeometry(0.3, 5.6, 4.6), mat.door, 21.65, 2.8, z, { cast: false });

  // the office block at the front corner: two storeys, a band between floors, glazing
  const OX = 14, OZ = 25, OW = 20, OD = 14, OH = 11.5;
  const office = { OX, OZ, OW, OD, OH };
  add(new THREE.BoxGeometry(OW, OH, OD), mat.body, OX, OH / 2, OZ);
  add(new THREE.BoxGeometry(OW + 0.6, 0.6, OD + 0.6), mat.deep, OX, OH + 0.3, OZ);
  add(new THREE.BoxGeometry(OW + 0.9, 1.5, OD + 0.9), mat.roof, OX, 5.6, OZ);
  const winF = new THREE.BoxGeometry(2.2, 2.6, 0.25);
  const winS = new THREE.BoxGeometry(0.25, 2.6, 2.2);
  for (const y of [2.9, 8.5]) {
    for (let c = 0; c < 6; c++) add(winF, mat.glass, OX - OW / 2 + 2.4 + c * 3.05, y, OZ + OD / 2 + 0.06, { cast: false });
    for (let c = 0; c < 4; c++) add(winS, mat.glass, OX + OW / 2 + 0.06, y, OZ - OD / 2 + 2.4 + c * 3.1, { cast: false });
  }
  for (const [x, z] of [[9, 22], [12.5, 22], [19, 27]]) add(new RoundedBoxGeometry(2.4, 1.3, 2.4, 2, 0.25), mat.line, x, OH + 0.6 + 0.65, z);

  // the rooftop sign (its logo is painted in by paintSign), on a frame at the front of the office roof
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 6.15),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  sign.position.set(OX - 2, OH + 0.6 + 4.1, OZ + OD / 2 - 1.2);
  sign.rotation.y = 0.18;
  g.add(sign);
  for (const dx of [-3.2, 3.2]) {
    const post = add(new THREE.BoxGeometry(0.22, 2.4, 0.22), mat.deep, OX - 2 + dx, OH + 0.6 + 1.2, OZ + OD / 2 - 1.5);
    post.castShadow = false;
  }

  // the company name on the band between the office floors
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 96;
  const x2 = c.getContext('2d');
  x2.fillStyle = '#ffffff';
  x2.font = '600 50px Archivo, "Helvetica Neue", Arial, sans-serif';
  x2.textAlign = 'center';
  x2.textBaseline = 'middle';
  if ('letterSpacing' in x2) x2.letterSpacing = '4px';
  x2.fillText('ARIFA PACKING & PACKAGING L.L.C.', 512, 50);
  const bandTex = new THREE.CanvasTexture(c);
  bandTex.colorSpace = THREE.SRGBColorSpace;
  bandTex.anisotropy = 4;
  const band = new THREE.Mesh(new THREE.PlaneGeometry(15, 1.4), new THREE.MeshBasicMaterial({ map: bandTex, transparent: true, depthWrite: false }));
  band.position.set(OX, 5.6, OZ + OD / 2 + 0.47);
  g.add(band);

  // parking along the long side: white bay lines and a row of cars
  const r = rand(7);
  for (let i = 0; i < 12; i++) {
    const z = -17 + i * 3.1;
    add(new THREE.BoxGeometry(5.6, 0.02, 0.14), mat.line, 31, 0.06, z - 1.55, { cast: false });
    if (r() < 0.8) {
      const m = r() < 0.6 ? mat.car : mat.carAlt;
      add(new RoundedBoxGeometry(4.2, 1.05, 1.9, 2, 0.35), m, 31, 0.6, z);
      add(new RoundedBoxGeometry(2.2, 0.75, 1.7, 2, 0.3), mat.carTop, 30.8, 1.45, z);
    }
  }

  // white trees round the plot
  const crown = new THREE.IcosahedronGeometry(1, 0);
  const trunk = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6);
  const trees = [[-30, 40], [-22, 44], [-12, 44], [-2, 44], [30, 44], [42, 40], [44, 28], [44, 14], [44, 0], [44, -14], [44, -28], [-34, 22], [-34, 2], [-34, -18], [-26, -36], [-10, -36], [8, -36], [26, -36]];
  for (const [x, z] of trees) {
    const s = 1.5 + r() * 0.9;
    if (skipTree(x, z)) continue;
    add(trunk, mat.trunk, x, 1.1, z);
    const cr = add(crown, mat.tree, x, 2.2 + s, z);
    cr.scale.set(s, s * 1.15, s);
    cr.rotation.y = r() * Math.PI;
  }

  g.position.set(-1, 0, -6); // the footprint's middle sits on the group's parent origin
  return { group: g, mats: mat, sign, office };
}

// the rooftop sign takes the site's own logo (leaves + ARIFA PACK), on a white board with a blue edge
export function paintSign(sign, svgMarkup, onDone) {
  if (!svgMarkup) return;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 548;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.strokeStyle = '#18388f';
    x.lineWidth = 18;
    x.beginPath();
    x.roundRect(9, 9, c.width - 18, c.height - 18, 36);
    x.fill();
    x.stroke();
    x.drawImage(img, 70, 50, c.width - 140, c.height - 100);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    sign.material.map = tex;
    sign.material.opacity = 1;
    sign.material.needsUpdate = true;
    onDone?.();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

// the site's nav logo, coloured for a sign (leaves green, word navy)
export function logoMarkup() {
  const src = document.querySelector<SVGSVGElement>('[data-nav-logo] svg');
  if (!src) return '';
  const svgEl = src.cloneNode(true) as SVGSVGElement;
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgEl.setAttribute('width', '1024');
  svgEl.setAttribute('height', '548');
  svgEl.querySelectorAll<SVGPathElement>('path').forEach((pa) => pa.setAttribute('fill', pa.classList.contains('leaf') ? '#5ba829' : '#0b3a8b'));
  svgEl.querySelectorAll('defs').forEach((d) => d.remove());
  return new XMLSerializer().serializeToString(svgEl);
}
