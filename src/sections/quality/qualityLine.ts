import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, autoVideo } from '@/lib/env';
import { isArPage, tc as tr } from '@/i18n/client';

/*
  Quality & Sustainability page.
  · the hero's viewfinder: our inspection footage with a running timecode
  · the line, checked: seven stations (our own footage, coil to dispatch) slide sideways; each
    station gets its tick as it passes the middle of the screen. On narrow screens, or with
    reduced motion, the stations simply stack.
  · the product dots: hover or focus one to see which product it is
*/

function initFinder() {
  const v = document.querySelector<HTMLVideoElement>('[data-finder]');
  const tc = document.querySelector<HTMLElement>('[data-timecode]');
  if (!v) return;
  autoVideo(v);
  if (!tc) return;
  const p2 = (n) => String(Math.floor(n)).padStart(2, '0');
  const draw = () => {
    const t = v.currentTime || 0;
    tc.textContent = `00:${p2(t / 60)}:${p2(t % 60)}:${p2((t % 1) * 25)}`;
  };
  gsap.ticker.add(() => { if (!v.paused) draw(); });
}

function initLine() {
  const sec = document.querySelector<HTMLElement>('[data-qline]');
  if (!sec) return;
  const pin = sec.querySelector<HTMLElement>('[data-qpin]');
  const track = sec.querySelector<HTMLElement>('[data-qtrack]');
  const stations = [...sec.querySelectorAll<HTMLElement>('[data-station]')];
  const count = sec.querySelector<HTMLElement>('[data-qcount]');
  const stage = sec.querySelector<HTMLElement>('[data-qstage]');
  stations.forEach((s) => s.querySelector<HTMLVideoElement>('video') && autoVideo(s.querySelector<HTMLVideoElement>('video')));

  let wide = false;
  let dist = 0;
  let trig = null;
  let at = -1;
  const setActive = (i) => {
    if (i === at) return;
    at = i;
    stations.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (count) count.textContent = String(i + 1).padStart(2, '0');
    if (stage) stage.textContent = stations[i]?.dataset.name || '';
  };

  // where each station is against the gate (the middle of the screen): passed ones are checked
  const judge = () => {
    const gate = window.innerWidth / 2;
    let best = 0;
    let bestD = Infinity;
    stations.forEach((s, k) => {
      const r = s.getBoundingClientRect();
      const c = r.left + r.width / 2;
      // (passed the gate: to its left in English; on /ar the stations run right to left, so to its right)
      s.classList.toggle('is-checked', isArPage() ? c >= gate - 2 : c <= gate + 2);
      const d = Math.abs(c - gate);
      if (d < bestD) { bestD = d; best = k; }
    });
    setActive(best);
  };

  function layout() {
    wide = window.innerWidth >= 900 && !env.reduced;
    sec.classList.toggle('is-sideways', wide);
    trig?.kill();
    trig = null;
    track.style.transform = '';
    if (!wide) {
      sec.style.height = '';
      stations.forEach((s) => s.classList.add('is-checked'));
      setActive(0);
      return;
    }
    // the track starts with its first station on the gate and ends with the last one on it
    const first = stations[0].getBoundingClientRect();
    const last = stations[stations.length - 1].getBoundingClientRect();
    const tr = track.getBoundingClientRect();
    const gate = window.innerWidth / 2;
    const start = gate - (first.left - tr.left + first.width / 2);
    const end = gate - (last.left - tr.left + last.width / 2);
    dist = Math.abs(start - end); // (on /ar the line runs the other way: end is past start)
    sec.style.height = `${dist + window.innerHeight}px`;
    gsap.set(track, { x: start });
    trig = ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
      animation: gsap.fromTo(track, { x: start }, { x: end, ease: 'none', immediateRender: false }),
      onUpdate: judge,
      onRefresh: judge,
    });
    judge();
  }
  layout();
  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { layout(); ScrollTrigger.refresh(); });
  });
  void pin;
}

function initMaterials() {
  const box = document.querySelector<HTMLElement>('[data-mat]');
  if (!box) return;
  const tip = box.querySelector<HTMLElement>('[data-mat-tip]');
  const dots = [...box.querySelectorAll<HTMLElement>('.mat__dot')];
  dots.forEach((d) => d.setAttribute('tabindex', '0'));
  const show = (d) => {
    if (!tip) return;
    tip.textContent = `${d.dataset.tip}${d.classList.contains('is-alu') ? tr(' · aluminium') : ''}`;
    tip.classList.add('is-on');
  };
  const hide = () => tip?.classList.remove('is-on');
  dots.forEach((d) => {
    d.addEventListener('pointerenter', () => show(d));
    d.addEventListener('focus', () => show(d));
  });
  box.querySelector<HTMLElement>('.q-mat__grid')?.addEventListener('pointerleave', hide);
  box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget as Node)) hide(); });
  if (!env.reduced) {
    // the dots fill in, product by product, the aluminium ones lighting as they arrive
    gsap.from(dots, {
      scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: { each: 0.012, from: 'start' },
      scrollTrigger: { trigger: box, start: 'top 80%' },
    });
  }
}

function initReveals() {
  if (env.reduced) return;
  gsap.utils.toArray<HTMLElement>('.q-lens, .q-docs__card').forEach((el, i) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

export function initQuality() {
  initFinder();
  initLine();
  initMaterials();
  initReveals();
  // the hero headline and the viewfinder come in once the loader has lifted
  const lines = document.querySelectorAll<HTMLElement>('.q-title .q-line > span');
  const rest = document.querySelectorAll<HTMLElement>('.q-hero .eyebrow, .q-lede, .q-proofs li');
  const finder = document.querySelector<HTMLElement>('.q-finder');
  if (!env.reduced) {
    gsap.set(lines, { yPercent: 140 });
    gsap.set(rest, { opacity: 0, y: 16 });
    gsap.set(finder, { opacity: 0, scale: 0.94 });
  }
  return {
    intro() {
      if (env.reduced) return;
      gsap.timeline()
        .to(lines, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, 0.1)
        .to(rest, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07 }, 0.35)
        .to(finder, { opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' }, 0.25);
    },
  };
}
