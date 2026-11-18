import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from '@/lib/env';
import { whenRenderer } from '@/three/renderers';

/*
  From Ajman to the world (About page). One white, pinned scene, driven by scroll:
    the Arifa factory (3D) → it folds into a pin at Ajman on the UAE map
    → the map widens to the world → routes fly out from Ajman.
  It ends on the white world map (no dark ending, no loop); scrolling back up plays it in reverse.
  The route ends are examples (unlabelled) until Arifa confirms its markets: change them in
  build/reach-map.mjs and re-bake src/data/reach-map.json.
  Reduced motion or no WebGL: the finished world map, still, with all three steps showing.
*/

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const span = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

export function initAboutReach() {
  const root = document.querySelector<HTMLElement>('[data-reach]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('[data-reach-stage]');
  const svg = root.querySelector<SVGSVGElement>('[data-reach-map]');
  const mark = root.querySelector<HTMLElement>('[data-reach-mark]');
  const uaeLabel = root.querySelector<HTMLElement>('[data-reach-uae]');
  const steps = [...root.querySelectorAll<HTMLElement>('[data-reach-steps] li')];
  const still = env.reduced || !env.webgl;
  if (still) root.classList.add('is-still');

  let map = null;
  let scene = null;
  let loading = null;
  let target = still ? 1 : 0; // where the scroll is
  let p = target; // where the picture is (eases toward target)
  let visible = false;
  let W = 1, H = 1;
  const L: Record<string, any> = {}; // layout for this viewport
  const el: Record<string, any> = {};
  let arcs = [];

  // ── map ──
  const arcD = ([x0, y0], [x1, y1]) => {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - d * 0.32;
    return `M${x0} ${y0}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1} ${y1}`;
  };

  function buildMap() {
    const { w, h, ajman } = map;
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = `
      <defs>
        <pattern id="reach-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.5" fill="#b3bac6"/></pattern>
      </defs>
      <g data-cam>
        <rect class="sea" x="-6000" y="-6000" width="${w + 12000}" height="${h + 12000}"/>
        <path class="world-solid" d="${map.world}" vector-effect="non-scaling-stroke"/>
        <path class="world-dots" d="${map.world}" fill="url(#reach-dots)"/>
        <path class="region" d="${map.region}" vector-effect="non-scaling-stroke"/>
        <path class="uae" d="${map.uae}" vector-effect="non-scaling-stroke"/>
        <g class="arcs"></g>
        <g class="ends"></g>
        <g class="packets"></g>
      </g>`;
    const cam = svg.querySelector<HTMLElement>('[data-cam]');
    Object.assign(el, {
      cam,
      sea: cam.querySelector<HTMLElement>('.sea'),
      worldSolid: cam.querySelector<HTMLElement>('.world-solid'),
      worldDots: cam.querySelector<HTMLElement>('.world-dots'),
      region: cam.querySelector<HTMLElement>('.region'),
      uae: cam.querySelector<HTMLElement>('.uae'),
      arcs: cam.querySelector<HTMLElement>('.arcs'),
      ends: cam.querySelector<HTMLElement>('.ends'),
      packets: cam.querySelector<HTMLElement>('.packets'),
    });
    arcs = map.dests.map((d, i) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', arcD(ajman, d));
      path.setAttribute('pathLength', '1');
      el.arcs.appendChild(path);
      const end = document.createElementNS(NS, 'circle');
      end.setAttribute('cx', d[0]);
      end.setAttribute('cy', d[1]);
      el.ends.appendChild(end);
      const dot = document.createElementNS(NS, 'circle');
      el.packets.appendChild(dot);
      // the order the routes leave in: nearest first
      const dist = Math.hypot(d[0] - ajman[0], d[1] - ajman[1]);
      return { path, end, dot, len: path.getTotalLength(), dist, i };
    });
    [...arcs].sort((a, b) => a.dist - b.dist).forEach((a, k) => { a.k = k; });
  }

  function layout() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    const wide = W >= 900;
    const [ux0, uy0, ux1, uy1] = map.uaeBox;
    const [rx0, ry0, rx1, ry1] = map.regionBox;
    L.wide = wide;
    // where the factory stands, and where Ajman sits once the UAE map is up
    L.build = wide ? [W * 0.66, H * 0.6] : [W * 0.5, H * 0.38];
    L.uaeAt = wide ? [W * 0.74, H * 0.34] : [W * 0.68, H * 0.22];
    L.sU = (wide ? Math.min(W * 0.4, H * 0.95) : Math.min(W * 0.78, H * 0.36)) / (ux1 - ux0);
    L.sW = wide ? Math.min((W * 0.68) / map.w, (H * 0.74) / map.h) : (W * 0.98) / map.w;
    const wc = wide ? [W * 0.6, H * 0.56] : [W * 0.5, H * 0.3];
    L.ajEnd = [wc[0] + (map.ajman[0] - map.w / 2) * L.sW, wc[1] + (map.ajman[1] - map.h / 2) * L.sW];
    // the Gulf detail must fade before its clipped edges could show
    L.sEdge = 1.08 * Math.max(W / (rx1 - rx0), H / (ry1 - ry0));
    L.uaeMid = [(ux0 + ux1) / 2, (uy0 + uy1) / 2];
    if (scene) scene.resize(W, H);
  }

  // ── one frame of the whole story at progress q ──
  function draw(q) {
    if (!map) return;
    const [ax, ay] = map.ajman;
    // zoom: from the UAE out to the world, about Ajman, which glides to its world place
    const t = smooth(span(q, 0.5, 0.8));
    const s = L.sU * Math.pow(L.sW / L.sU, t);
    const toU = smooth(span(q, 0.26, 0.44));
    const aj = q < 0.5
      ? [lerp(L.build[0], L.uaeAt[0], toU), lerp(L.build[1], L.uaeAt[1], toU)]
      : [lerp(L.uaeAt[0], L.ajEnd[0], t), lerp(L.uaeAt[1], L.ajEnd[1], t)];
    el.cam.setAttribute('transform', `matrix(${s} 0 0 ${s} ${aj[0] - ax * s} ${aj[1] - ay * s})`);

    const mapIn = span(q, 0.28, 0.4);
    svg.style.opacity = String(mapIn);
    // layers: the Gulf in detail → the world's coastlines → the world in dots
    const regionOut = clamp01((Math.log(s) - Math.log(L.sEdge)) / (Math.log(L.sEdge * 1.6) - Math.log(L.sEdge)));
    el.region.style.opacity = regionOut;
    el.region.style.display = regionOut > 0.01 ? '' : 'none';
    const dots = span(t, 0.72, 0.96);
    el.worldDots.style.opacity = dots;
    el.worldDots.style.display = dots > 0.01 ? '' : 'none';
    el.worldSolid.style.opacity = 1 - span(t, 0.8, 1);
    el.sea.style.opacity = 1 - span(t, 0.55, 0.9);
    const navy = span(t, 0.55, 0.85);
    el.uae.style.fill = `rgb(${Math.round(lerp(233, 11, navy))}, ${Math.round(lerp(239, 58, navy))}, ${Math.round(lerp(252, 139, navy))})`;

    // routes: drawn one after another, nearest first, a green packet at each head
    const k = 1 / s;
    el.arcs.setAttribute('stroke-width', (1.5 * k).toFixed(3));
    const n = arcs.length;
    for (const a of arcs) {
      const a0 = 0.8 + (a.k / n) * 0.13;
      const f = span(q, a0, a0 + 0.07);
      a.path.style.strokeDashoffset = 1 - f;
      a.path.style.opacity = f > 0 ? 1 : 0;
      a.end.setAttribute('r', (f >= 1 ? 4 : f > 0.85 ? 4 * ((f - 0.85) / 0.15) : 0) * k);
      if (f > 0 && f < 1) {
        const pt = a.path.getPointAtLength(f * a.len);
        a.dot.setAttribute('cx', pt.x);
        a.dot.setAttribute('cy', pt.y);
        a.dot.setAttribute('r', 3.2 * k);
      } else {
        a.dot.setAttribute('r', 0);
      }
    }

    // the Ajman pin takes over from the factory; the UAE name shows while we're close
    const pinIn = span(q, 0.4, 0.46);
    mark.style.transform = `translate(${aj[0]}px, ${aj[1]}px)`;
    mark.style.opacity = String(pinIn);
    mark.style.setProperty('--pop', String(0.4 + 0.6 * pinIn));
    mark.style.setProperty('--label', String(1 - span(t, 0.45, 0.75))); // the name steps aside for the routes
    const um = [(L.uaeMid[0] - ax) * s + aj[0], (L.uaeMid[1] - ay) * s + aj[1]];
    uaeLabel.style.transform = `translate(${um[0]}px, ${um[1] + 18}px) translate(-50%, -50%)`;
    uaeLabel.style.opacity = String(span(q, 0.4, 0.46) * (1 - span(t, 0.05, 0.3)));

    // the words beside it
    const at = q < 0.3 ? 0 : q < 0.66 ? 1 : 2;
    steps.forEach((li, i) => li.classList.toggle('is-on', still || i === at));
    root.style.setProperty('--fade', String(1 - span(q, 0.28, 0.4))); // the white edge round the factory

    if (scene) {
      scene.setAnchor(aj[0], aj[1]);
      scene.setProgress(q);
    }
  }

  function tick(time, dt) {
    if (!map) return;
    const d = target - p;
    const ease = 1 - Math.pow(0.86, Math.min(dt, 100) / 16.7); // the same feel at any frame rate
    p = Math.abs(d) < 0.0005 ? target : p + d * ease;
    draw(p);
    if (scene && !scene.gone) scene.frame(dt / 1000);
    else if (scene && scene.pivot.visible) scene.frame(0); // the last frame, with the factory gone
  }

  async function load() {
    if (loading) return loading;
    loading = (async () => {
      map = (await import('@/data/reach-map.json')).default;
      buildMap();
      if (!still) {
        try {
          const { ReachScene } = await import('@/three/scenes/ReachScene');
          const renderer = await whenRenderer('reach');
          if (!renderer) throw new Error('no WebGL renderer');
          scene = new ReachScene(renderer, { lowPower: env.lowPower });
          scene.setSign(logoMarkup());
        } catch (err) {
          console.warn('Reach scene: no WebGL, map only.', err);
          scene = null;
        }
      }
      layout();
      draw(p);
      if (scene) scene.frame(0);
      if (visible && !still) gsap.ticker.add(tick);
    })();
    return loading;
  }

  // the site's own logo, coloured for the rooftop sign
  function logoMarkup() {
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

  // load ahead of time, run only while on screen
  ScrollTrigger.create({ trigger: root, start: 'top bottom+=80%', once: true, onEnter: load });
  ScrollTrigger.create({
    trigger: root, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      if (still || !map) return;
      if (visible) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    },
  });
  if (!still) {
    ScrollTrigger.create({
      trigger: root, start: 'top top', end: 'bottom bottom',
      // scroll down plays it forward, scroll back up plays it in reverse
      onUpdate: (self) => {
        target = self.progress > 0.985 ? 1 : self.progress;
      },
    });
  }
  window.addEventListener('resize', () => {
    if (!map) return;
    layout();
    draw(p);
    if (scene) { scene.dirty = true; scene.frame(0); }
  });
  if (process.env.NODE_ENV === 'development') window.__reach = { get p() { return p; }, set: (v) => { target = p = v; draw(p); if (scene) scene.frame(0); }, load, get scene() { return scene; } };
}
