import * as THREE from 'three';

/* Procedural maps drawn on canvas — no downloads, deterministic, crisp at any DPR. */

function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Sobel → tangent-space normal map from a grayscale height canvas
function heightToNormal(src, strength = 2) {
  const w = src.width, h = src.height;
  const sctx = src.getContext('2d', { willReadFrequently: true });
  const hd = sctx.getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const d = img.data;
  const H = (x, y) => hd[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
      const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
      let nx = -dx * strength, ny = dy * strength, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const i = (y * w + x) * 4;
      d[i] = (nx * 0.5 + 0.5) * 255;
      d[i + 1] = (ny * 0.5 + 0.5) * 255;
      d[i + 2] = (nz * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

const tex = (canvas, { srgb = false, repeat = false } = {}) => {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

// Brushed / rolled aluminium: long streaks along u, faint roll marks along v.
export function brushedMaps(seed = 3) {
  const W = 1024, H = 1024;
  const r = rng(seed);
  const hc = document.createElement('canvas');
  hc.width = W; hc.height = H;
  const g = hc.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#808080';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const y = r() * H;
    const v = 100 + r() * 60;
    g.strokeStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.12})`;
    g.lineWidth = 0.6 + r() * 1.4;
    g.beginPath();
    const x0 = r() * W - W * 0.5;
    g.moveTo(x0, y);
    g.lineTo(x0 + W * (0.4 + r() * 1.2), y + (r() - 0.5) * 1.2);
    g.stroke();
  }
  const normal = heightToNormal(hc, 1.4);

  // roughness (G channel) with soft blotches so highlights don't look CG-perfect
  const rc = document.createElement('canvas');
  rc.width = 512; rc.height = 512;
  const rg = rc.getContext('2d');
  rg.fillStyle = 'rgb(0,86,0)';
  rg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 90;
    const grad = rg.createRadialGradient(x, y, 0, x, y, rad);
    const v = Math.floor(60 + r() * 60);
    grad.addColorStop(0, `rgba(0,${v},0,0.35)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    rg.fillStyle = grad;
    rg.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 900; i++) {
    const y = r() * 512;
    rg.fillStyle = `rgba(0,${Math.floor(60 + r() * 80)},0,0.12)`;
    rg.fillRect(0, y, 512, 0.6 + r());
  }
  return { normal: tex(normal, { repeat: true }), roughness: tex(rc, { repeat: true }) };
}

// Lid emboss: raised panel, a seating groove, diagonal pattern, code + wordmark.
export function lidMaps(code = '83185') {
  const W = 1400, H = 980;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, W, H);

  const rr = (x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  g.filter = 'blur(3px)';
  // stepped concentric frames, like the stamped lid in the film
  ([[90, 0.75, '#9a9a9a'], [150, 0.8, '#6a6a6a'], [190, 0.75, '#a4a4a4'], [300, 0.6, '#8e8e8e']] as [number, number, string][]).forEach(([inset, , col]) => {
    g.strokeStyle = col;
    g.lineWidth = 14;
    rr(inset, inset * 0.72, W - inset * 2, H - inset * 1.44, 120 - inset * 0.2);
    g.stroke();
  });
  // diagonal pattern in the corners
  g.strokeStyle = '#949494';
  g.lineWidth = 8;
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? W - 230 : 230, sy = i < 2 ? 200 : H - 200;
    const dx = i % 2 ? -1 : 1, dy = i < 2 ? 1 : -1;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(sx + dx * k * 26, sy);
      g.lineTo(sx, sy + dy * k * 26 * 0.7);
      g.stroke();
    }
  }
  g.filter = 'blur(1.6px)';
  g.fillStyle = '#b8b8b8';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '600 88px Archivo, Arial, sans-serif';
  g.fillText('ARIFA PACK', W / 2, H / 2 - 46);
  g.font = '500 64px "IBM Plex Mono", monospace';
  g.fillStyle = '#ababab';
  g.fillText(code, W / 2, H / 2 + 58);
  g.font = '500 30px "IBM Plex Mono", monospace';
  g.fillStyle = '#a0a0a0';
  g.fillText('MADE IN U.A.E', W / 2, H / 2 + 128);
  g.filter = 'none';

  const normal = heightToNormal(c, 3.2);
  return { normal: tex(normal) };
}

// Coil end face: tightly wound rings of sheet around a cardboard core.
export function coilEndMap(inner = 0.37) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  const r = rng(11);
  g.fillStyle = '#9ea4ab';
  g.fillRect(0, 0, S, S);
  const cx = S / 2, R = S / 2;
  for (let rad = R * inner; rad < R; rad += 1.6 + r() * 1.3) {
    const v = Math.floor(120 + r() * 110);
    g.strokeStyle = `rgb(${v},${v + 3},${v + 8})`;
    g.lineWidth = 0.9 + r() * 0.8;
    g.beginPath();
    g.arc(cx, cx, rad, 0, Math.PI * 2);
    g.stroke();
  }
  // brushed sheen across the face
  const grad = g.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, 'rgba(255,255,255,0.18)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return tex(c, { srgb: true });
}

// Cardboard core / carton
export function cardboardMap() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const r = rng(5);
  g.fillStyle = '#9b7a52';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = Math.floor(120 + r() * 60);
    g.fillStyle = `rgba(${v},${Math.floor(v * 0.78)},${Math.floor(v * 0.52)},0.25)`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1);
  }
  return tex(c, { srgb: true, repeat: true });
}

// Crumpled foil / film: creases and flat facets, as a tiling normal map
export function crinkleMaps(seed = 9) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  const r = rng(seed);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, S, S);
  // flat facets, each pressed to its own height
  for (let i = 0; i < 260; i++) {
    const x = r() * S, y = r() * S, k = 30 + r() * 70;
    const v = Math.floor(96 + r() * 64);
    g.fillStyle = `rgba(${v},${v},${v},0.22)`;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * k * 2, y + (r() - 0.5) * k * 2);
    g.lineTo(x + (r() - 0.5) * k * 2, y + (r() - 0.5) * k * 2);
    g.closePath();
    g.fill();
  }
  // creases: long, mostly straight folds, light on one side and dark on the other
  g.filter = 'blur(1.2px)';
  for (let i = 0; i < 120; i++) {
    const x = r() * S, y = r() * S, a = r() * Math.PI, len = 50 + r() * 220;
    const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
    const v = r() > 0.5 ? 175 : 70;
    g.strokeStyle = `rgba(${v},${v},${v},${0.18 + r() * 0.2})`;
    g.lineWidth = 1 + r() * 2.5;
    g.beginPath();
    g.moveTo(x - dx / 2, y - dy / 2);
    g.lineTo(x + (r() - 0.5) * 20, y + (r() - 0.5) * 20);
    g.lineTo(x + dx / 2, y + dy / 2);
    g.stroke();
  }
  g.filter = 'none';
  return { normal: tex(heightToNormal(c, 2.4), { repeat: true }) };
}
