import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from '@/lib/env';
import { ajmanNow, status } from '@/lib/clock';
import { tc } from '@/i18n/client';

/*
  The contact page's second half: a 24-hour dial of Ajman time with the working hours lit and a
  hand at "now"; the UAE drawn as a dotted line map with Ajman pulsing (no map embed, no links
  out); copy buttons for numbers, emails and the address; and "Talk to Arifa", which opens
  the assistant.
*/

const OPEN_H = 8;
const CLOSE_H = 20;

const polar = (cx, cy, r, h) => {
  const a = (h / 24) * Math.PI * 2 - Math.PI / 2; // midnight at the top
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arc = (cx, cy, r, h0, h1) => {
  const [x0, y0] = polar(cx, cy, r, h0);
  const [x1, y1] = polar(cx, cy, r, h1);
  const large = (h1 - h0) % 24 > 12 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

function initHours() {
  const dial = document.querySelector<HTMLElement>('[data-dial]');
  const state = document.querySelector<HTMLElement>('[data-hours-state]');
  const time = document.querySelector<HTMLElement>('[data-hours-time]');
  const local = document.querySelector<HTMLElement>('[data-local-time]');
  if (!dial) return;
  const C = 110, R = 88;
  let ticks = '';
  for (let h = 0; h < 24; h++) {
    const [x0, y0] = polar(C, C, R + 12, h);
    const [x1, y1] = polar(C, C, R + (h % 6 === 0 ? 20 : 16), h);
    ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="${h % 6 === 0 ? 'is-major' : ''}"/>`;
  }
  const nums = [0, 6, 12, 18].map((h) => {
    const [x, y] = polar(C, C, R - 22, h);
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}">${String(h).padStart(2, '0')}</text>`;
  }).join('');
  dial.innerHTML = `
    <circle class="dial__ring" cx="${C}" cy="${C}" r="${R}"/>
    <path class="dial__open" d="${arc(C, C, R, OPEN_H, CLOSE_H)}" pathLength="1"/>
    <g class="dial__ticks">${ticks}</g>
    <g class="dial__nums">${nums}</g>
    <g class="dial__hand" data-hand><line x1="${C}" y1="${C}" x2="${C}" y2="${C - R + 6}"/><circle cx="${C}" cy="${C - R + 6}" r="5"/></g>
    <circle class="dial__hub" cx="${C}" cy="${C}" r="6"/>`;
  const hand = dial.querySelector<HTMLElement>('[data-hand]');
  const openArc = dial.querySelector<HTMLElement>('.dial__open');
  const tick = () => {
    const d = ajmanNow();
    const s = status(d);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const h = d.getHours() + d.getMinutes() / 60;
    hand.setAttribute('transform', `rotate(${(h / 24) * 360} ${C} ${C})`);
    openArc.classList.toggle('is-off', d.getDay() === 0); // Sunday: closed all day
    dial.classList.toggle('is-open', s.open);
    if (state) state.textContent = s.open ? tc('Open now · until {h}:00', { h: CLOSE_H }) : tc('Closed · opens {next}', { next: s.next });
    if (time) time.textContent = tc('{time} in Ajman · GST', { time: `${hh}:${mm}` });
    if (local) local.textContent = `${hh}:${mm} ${tc('GST')} (UTC+4)`;
  };
  tick();
  setInterval(tick, 20000);
  if (!env.reduced) {
    gsap.fromTo(openArc, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: dial, start: 'top 85%' } });
  }
}

async function initWhere() {
  const svg = document.querySelector<HTMLElement>('[data-where-map]');
  if (!svg) return;
  const map = (await import('@/data/uae-outline.json')).default;
  const [ax, ay] = map.ajman;
  const place = {
    'Abu Dhabi': { dx: -22, dy: -22, anchor: 'end' }, // out in the Gulf, clear of the islands
    Dubai: { dx: -16, dy: 22, anchor: 'end' },
    Sharjah: { dx: -16, dy: -12, anchor: 'end' },
  };
  svg.innerHTML = `
    <defs>
      <pattern id="where-dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.7" class="where__dot"/></pattern>
      <radialGradient id="where-glow"><stop offset="0" stop-color="#8cc21e" stop-opacity="0.45"/><stop offset="1" stop-color="#8cc21e" stop-opacity="0"/></radialGradient>
    </defs>
    <path class="where__land" d="${map.uae}" fill="url(#where-dots)"/>
    <path class="where__coast" d="${map.uae}" pathLength="1"/>
    <circle class="where__halo" cx="${ax}" cy="${ay}" r="120" fill="url(#where-glow)"/>
    <g class="where__cities">${map.cities.map((c) => {
      const p = place[c.name] || { dx: 14, dy: 6, anchor: 'start' };
      return `<g><circle cx="${c.at[0]}" cy="${c.at[1]}" r="4"/><text x="${c.at[0] + p.dx}" y="${c.at[1] + p.dy}" text-anchor="${p.anchor}">${tc(c.name)}</text></g>`;
    }).join('')}</g>
    <g class="where__pin">
      <circle class="where__ring" cx="${ax}" cy="${ay}" r="10"/>
      <circle class="where__ring where__ring--2" cx="${ax}" cy="${ay}" r="10"/>
      <circle class="where__core" cx="${ax}" cy="${ay}" r="8"/>
      <text class="where__name" x="${ax + 20}" y="${ay - 14}">${tc('Ajman')}</text>
      <text class="where__sub" x="${ax + 20}" y="${ay + 8}">${tc('Arifa · Al Jurf')}</text>
    </g>`;
  if (env.reduced) return;
  const coast = svg.querySelector<HTMLElement>('.where__coast');
  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 80%' } });
  tl.fromTo(coast, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' })
    .from(svg.querySelector<HTMLElement>('.where__land'), { opacity: 0, duration: 1.2 }, 0.4)
    .from(svg.querySelectorAll<HTMLElement>('.where__cities g'), { opacity: 0, y: 8, duration: 0.6, stagger: 0.12 }, 1.2)
    .from(svg.querySelector<HTMLElement>('.where__halo'), { opacity: 0, scale: 0.4, transformOrigin: 'center', duration: 1.2, ease: 'expo.out' }, 1.5)
    .from(svg.querySelector<HTMLElement>('.where__pin'), { opacity: 0, y: -40, duration: 1, ease: 'bounce.out' }, 1.6);
  ScrollTrigger.refresh();
}

function initCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const text = b.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch {}
        ta.remove();
      }
      const t = b.querySelector<HTMLElement>('.btn__text') || b;
      const was = t.textContent;
      const now = tc(ok ? 'Copied' : 'Select and copy');
      t.textContent = now;
      if (t.dataset.text) t.dataset.text = now;
      b.classList.add('is-copied');
      const out = document.querySelector<HTMLElement>('[data-copied]');
      if (out && b.closest<HTMLElement>('.ct-where')) out.textContent = ok ? tc('Copied: {text}', { text }) : text;
      setTimeout(() => {
        t.textContent = was;
        if (t.dataset.text) t.dataset.text = was;
        b.classList.remove('is-copied');
      }, 1800);
    });
  });
}

// "Talk to Arifa": open the assistant panel from its leaf
function initTalk() {
  document.querySelectorAll<HTMLElement>('[data-talk]').forEach((b) => b.addEventListener('click', () => {
    const dock = document.querySelector<HTMLElement>('[data-assist-dock]');
    if (!dock) return;
    dock.hidden = false;
    dock.click();
  }));
}

export function initContactInfo() {
  initHours();
  initWhere();
  initCopy();
  initTalk();
  if (!env.reduced) {
    gsap.utils.toArray<HTMLElement>('.ct-line-card, .ct-hours, .ct-talk').forEach((el, i) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', delay: (i % 4) * 0.08, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  }
}
