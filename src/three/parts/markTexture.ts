import * as THREE from 'three';

export const LOGO_ASPECT = 773 / 414; // the traced logo's viewBox

// The nav's own SVG logo as an image: green leaves, the wordmark in `ink`
// (or, with `solid`, the whole mark in one colour — for embossing masks).
export async function logoImage({ ink = '#0b3a8b', solid = null, width = 1600 } = {}) {
  const src = document.querySelector<SVGSVGElement>('[data-nav-logo] .logo-svg');
  if (!src) return null;
  const svg = src.cloneNode(true) as SVGSVGElement;
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(Math.round(width / LOGO_ASPECT)));
  svg.querySelector<HTMLElement>('.logo-word')?.setAttribute('style', `fill:${solid || ink}`);
  if (solid) svg.querySelector<HTMLElement>('.logo-leaves')?.setAttribute('fill', solid);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}

/*
  The ARIFA PACK mark that sits in the floor of every product, rasterised from the
  nav's own SVG logo: navy ink for aluminium, silver ink for black plastic.
*/
export async function loadMarkTextures() {
  const make = async (ink) => {
    const img = await logoImage({ ink });
    if (!img) return null;
    const W = 1024, H = Math.round(W / LOGO_ASPECT);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    // pressed into the metal: a soft shade under the print
    g.shadowColor = 'rgba(0,0,0,0.28)';
    g.shadowOffsetY = 4;
    g.shadowBlur = 5;
    g.drawImage(img, 24, 24, W - 48, H - 48);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const [dark, light] = await Promise.all([make('#0b3a8b'), make('#e9ecef')]);
  return { dark, light };
}
