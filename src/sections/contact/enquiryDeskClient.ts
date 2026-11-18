import gsap from 'gsap';
import { env } from '@/lib/env';
import { tc } from '@/i18n/client';
import { enquiry, describe } from '@/lib/enquiry';
import type Lenis from 'lenis';
import type { ClientProduct } from '@/data/types';
import type { EnquiryItem } from '@/lib/enquiry';
import type { QuoteFill } from '@/assistant/types';

/*
  The enquiry desk (contact page). Six quick questions, one at a time, and beside them a carton
  label that prints each answer as it's given: contents, quantity, delivery, who it's from, how to
  reply. A line on the label jumps back to its question. "Seal & send" tapes the label shut and
  opens the visitor's email app with the enquiry written up (there's no server for leads yet).
  Products saved on the products page arrive already packed; the assistant can fill it in too
  (event 'arifa:quote-fill'). Without JavaScript every question shows at once and the form posts
  to the email app.
*/

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s.-]/gu, ' ').replace(/\s+/g, ' ').trim();
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const PLACE = { from: 'Your name · company', what: 'Nothing packed yet', // (translated as they're printed: tc())
  much: '—', often: '—', where: '—', reply: '—', note: '—' };

function newRef(fresh = false) {
  try {
    const s = sessionStorage.getItem('arifa-enquiry-ref');
    if (s && !fresh) return s;
  } catch {}
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tail = '';
  for (let i = 0; i < 4; i++) tail += abc[Math.floor(Math.random() * abc.length)];
  const ref = `AP-${p2(d.getDate())}${p2(d.getMonth() + 1)}${String(d.getFullYear()).slice(2)}-${tail}`;
  try { sessionStorage.setItem('arifa-enquiry-ref', ref); } catch {}
  return ref;
}

function fnv(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function initDesk({ lenis }: { lenis?: Lenis } = {}) {
  const form = document.querySelector<HTMLFormElement>('[data-desk]');
  const label = document.querySelector<HTMLElement>('[data-label]');
  if (!form || !label) return { intro() {} };
  const $ = (s, r = form) => r.querySelector<HTMLElement>(s);
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const count = $('[data-desk-count]'), prog = $('[data-desk-progress]'), stepName = $('[data-desk-name]');
  const back = $('[data-back]'), next = $('[data-next]'), send = $('[data-send]'), hint = $('[data-hint]'), msg = $('[data-msg]');
  const find = $('[data-find]') as HTMLInputElement, hits = $('[data-hits]'), pickedEl = $('[data-picked]'), detail = $('[data-detail]') as HTMLInputElement;
  /** a named field of the form */
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null;
  const done = document.querySelector<HTMLElement>('[data-done]');
  const barcode = label.querySelector<HTMLElement>('[data-barcode]');
  const cell = (k) => label.querySelector<HTMLElement>(`[data-v="${k}"]`);

  const data = (() => {
    try { return JSON.parse(document.getElementById('catalogue-data')?.textContent || '{}'); } catch { return {}; }
  })();
  const products: ClientProduct[] = data.products || [];
  const byId = new Map(products.map((p) => [p.id, p]));

  let ref = newRef();
  const setRef = () => label.querySelectorAll<HTMLElement>('[data-ref], [data-ref-foot]').forEach((el) => { el.textContent = ref; });
  setRef();
  form.classList.add('is-live'); // one question at a time from here on

  // the family panels: a panel's film plays only while it's open (hovered or focused)
  if (!env.reduced) {
    form.querySelectorAll<HTMLElement>('.pick').forEach((pk) => {
      const v = pk.querySelector<HTMLVideoElement>('video');
      if (!v) return;
      const play = () => {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      };
      const stop = () => v.pause();
      pk.addEventListener('pointerenter', play);
      pk.addEventListener('focusin', play);
      pk.addEventListener('pointerleave', stop);
      pk.addEventListener('focusout', stop);
    });
  }

  // ── products in the enquiry: from the enquiry list, or found by code / name ──
  let picked = [];
  const famBox = (familyId: string, familyName?: string) =>
    form.querySelector<HTMLInputElement>(`.pick[data-family="${familyId}"] input`) ||
    [...form.querySelectorAll<HTMLInputElement>('input[name="family"]')].find((i) => i.value === familyName);

  function renderPicked() {
    pickedEl.innerHTML = picked.map((p) => `<li>${p.img ? `<img src="${esc(p.img)}" alt="" width="40" height="26" loading="lazy" />` : '<i></i>'}<span><b>${esc(p.ref)}</b> ${esc(p.name)}</span><button type="button" aria-label="${esc(tc('Remove {ref}', { ref: p.ref }))}" data-rm="${esc(p.id)}">×</button></li>`).join('');
    detail.value = describe(picked);
  }
  function addProduct(p) {
    if (!p) return;
    if (!picked.some((x) => x.id === p.id)) picked.push(p);
    const box = famBox(p.family, p.familyName);
    if (box) box.checked = true;
    find.value = '';
    renderHits();
    renderPicked();
    update();
  }
  pickedEl.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-rm]');
    if (!b) return;
    picked = picked.filter((p) => p.id !== b.dataset.rm);
    renderPicked();
    update();
  });
  enquiry.list().forEach((i) => {
    const p: Partial<ClientProduct> & EnquiryItem = byId.get(i.id) || { ...i, family: null };
    picked.push(p);
    const box = famBox(p.family, p.familyName);
    if (box) box.checked = true;
  });
  renderPicked();

  // arriving from the industries page: ?trade=…&families=… ticks the business and its kit
  const qs = new URLSearchParams(window.location.search);
  (qs.get('families') || '').split(',').filter(Boolean).forEach((id) => {
    const box = famBox(id);
    if (box) box.checked = true;
  });
  const trade = qs.get('trade');
  if (trade) {
    const r = [...form.querySelectorAll<HTMLInputElement>('input[name="trade"]')].find((i) => i.value === trade);
    if (r) r.checked = true;
  }

  const index = products.map((p) => ({ p, key: norm(`${p.ref} ${p.code} ${p.name} ${p.nameEn || ''} ${p.familyName}`) }));
  let hitList = [];
  let hitAt = -1;
  function renderHits() {
    const q = norm(find.value);
    if (q.length < 2) {
      hits.hidden = true;
      hits.innerHTML = '';
      find.setAttribute('aria-expanded', 'false');
      return;
    }
    const words = q.split(' ');
    hitList = index
      .filter(({ key }) => words.every((w) => key.includes(w)))
      .sort((a, b) => Number(b.p.ref.toLowerCase().startsWith(q)) - Number(a.p.ref.toLowerCase().startsWith(q)))
      .slice(0, 6)
      .map((x) => x.p);
    hitAt = hitList.length ? 0 : -1;
    hits.innerHTML = hitList.length
      ? hitList.map((p, i) => `<li role="option" id="d-hit-${i}" data-i="${i}" aria-selected="${i === hitAt}">${p.img ? `<img src="${esc(p.img)}" alt="" width="48" height="32" loading="lazy" />` : '<i></i>'}<span><b>${esc(p.ref)}</b> ${esc(p.name)}</span><small class="mono">${esc(p.code && p.code !== '—' ? p.code : p.familyName)}</small></li>`).join('')
      : `<li class="is-none">${esc(tc('No match. Add it in your notes at the last question.'))}</li>`;
    hits.hidden = false;
    find.setAttribute('aria-expanded', 'true');
    find.setAttribute('aria-activedescendant', hitAt >= 0 ? `d-hit-${hitAt}` : '');
  }
  function moveHit(d) {
    if (!hitList.length) return;
    hitAt = (hitAt + d + hitList.length) % hitList.length;
    hits.querySelectorAll<HTMLElement>('[data-i]').forEach((li) => li.setAttribute('aria-selected', String(+li.dataset.i === hitAt)));
    find.setAttribute('aria-activedescendant', `d-hit-${hitAt}`);
  }
  find.addEventListener('input', renderHits);
  find.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveHit(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveHit(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (hitAt >= 0) addProduct(hitList[hitAt]); }
    else if (e.key === 'Escape') { hits.hidden = true; find.setAttribute('aria-expanded', 'false'); }
  });
  hits.addEventListener('mousedown', (e) => {
    const li = (e.target as Element).closest<HTMLElement>('[data-i]');
    if (!li) return;
    e.preventDefault();
    addProduct(hitList[+li.dataset.i]);
    find.focus();
  });
  find.addEventListener('blur', () => setTimeout(() => { hits.hidden = true; find.setAttribute('aria-expanded', 'false'); }, 120));

  // ── what's been answered ──
  const val = (n: string) => (field(n)?.value || '').trim();
  const radio = (n) => form.querySelector<HTMLInputElement>(`input[name="${n}"]:checked`)?.value || '';
  const checks = (n) => [...form.querySelectorAll<HTMLInputElement>(`input[name="${n}"]:checked`)].map((i) => i.value);
  const snap = () => ({
    families: checks('family'), items: picked.slice(), size: radio('size'), qty: val('quantity'), often: radio('often'),
    region: radio('region'), city: val('city'), name: val('name'), company: val('company'), trade: radio('trade'),
    channel: radio('channel') || 'Email', email: val('email'), phone: val('phone'), extra: checks('extra'), message: val('message'),
  });
  function lines(s) {
    const loose = s.families.filter((f) => !s.items.some((i) => i.familyName === f));
    const reach = s.channel === 'Email' ? s.email : s.phone;
    return {
      from: [[s.name, s.company].filter(Boolean).join(' · '), tc(s.trade)].filter(Boolean).join('\n'),
      what: [...s.items.map((i) => `${i.ref} ${i.name}${i.code && i.code !== '—' ? ` · ${i.code}` : ''}`), ...loose.map((f) => tc('{family} · range', { family: f }))].join('\n'),
      much: [tc(s.size), s.qty].filter(Boolean).join(' · '),
      often: tc(s.often),
      where: [s.city, tc(s.region)].filter(Boolean).join(' · '),
      reply: tc(s.channel) + (reach ? `\n${reach}` : ''),
      note: [...s.extra.map((x) => tc(x)), s.message].filter(Boolean).join(' · '),
    };
  }

  // ── the label prints each answer as it changes ──
  const last = {};
  const typing = new WeakMap();
  function print(key, text, animate) {
    const el = cell(key);
    if (!el) return;
    typing.get(el)?.kill();
    el.classList.remove('is-printing');
    const prev = last[key] || '';
    last[key] = text;
    if (!text) { el.innerHTML = `<i>${esc(tc(PLACE[key]))}</i>`; return; }
    // typing into a field: keep up with it; a new answer: print it
    if (!animate || env.reduced || (prev && text.startsWith(prev)) || (prev && prev.startsWith(text))) { el.textContent = text; return; }
    const o = { n: 0 };
    el.classList.add('is-printing');
    typing.set(el, gsap.to(o, {
      n: text.length, duration: Math.min(0.7, 0.14 + text.length * 0.012), ease: 'none',
      onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); },
      onComplete: () => { el.textContent = text; el.classList.remove('is-printing'); },
    }));
    gsap.fromTo(label, { y: -3 }, { y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  }
  function drawBarcode(seed) {
    let h = fnv(seed + ref) || 1;
    const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    let x = 7;
    let out = '<rect x="0" width="2" height="54"/><rect x="4" width="1" height="54"/>';
    while (x < 312) {
      const w = 1 + Math.floor(rnd() * 3.4);
      if (rnd() > 0.4) out += `<rect x="${x}" width="${w}" height="54"/>`;
      x += w + 1 + Math.floor(rnd() * 2);
    }
    out += '<rect x="315" width="1" height="54"/><rect x="318" width="2" height="54"/>';
    barcode.innerHTML = out;
  }
  function update(animate = true) {
    const t = lines(snap());
    Object.keys(t).forEach((k) => { if (t[k] !== (last[k] || '')) print(k, t[k], animate); });
    drawBarcode(Object.values(t).join('|'));
    const s = snap();
    form.querySelector<HTMLElement>('[data-need="email"] [data-req]').hidden = s.channel !== 'Email';
    form.querySelector<HTMLElement>('[data-need="phone"] [data-req]').hidden = s.channel === 'Email';
  }
  form.addEventListener('input', () => update());
  form.addEventListener('change', () => update());

  // ── one question at a time ──
  let at = 0;
  const stepIndex = (name) => steps.findIndex((s) => s.dataset.step === name);
  function show(i, { focus = true } = {}) {
    at = Math.max(0, Math.min(steps.length - 1, i));
    const cur = steps[at];
    steps.forEach((s, k) => s.classList.toggle('is-active', k === at));
    count.textContent = `${String(at + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    stepName.textContent = cur.dataset.name;
    prog.style.transform = `scaleX(${(at + 1) / steps.length})`;
    back.hidden = at === 0;
    const end = at === steps.length - 1;
    next.hidden = end;
    send.hidden = !end;
    hint.hidden = end;
    label.querySelectorAll<HTMLElement>('[data-goto]').forEach((r) => r.classList.toggle('is-current', r.dataset.goto === cur.dataset.step));
    msg.textContent = '';
    if (focus) {
      const target = cur.matches('[data-step="who"], [data-step="reply"]')
        ? cur.querySelector<HTMLInputElement>('.dfield input')
        : cur.querySelector<HTMLElement>('legend');
      if (target === cur.querySelector<HTMLElement>('legend')) target.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    }
    if (!env.reduced) gsap.fromTo(cur.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05, overwrite: true });
  }
  function mark(name) {
    const f = field(name)?.closest<HTMLElement>('.dfield');
    f?.classList.add('is-invalid');
    field(name)?.focus({ preventScroll: true });
  }
  form.querySelectorAll<HTMLTextAreaElement>('.dfield input, .dfield textarea').forEach((i) => i.addEventListener('input', () => i.closest<HTMLElement>('.dfield').classList.remove('is-invalid')));
  function check(i) {
    const s = snap();
    const step = steps[i].dataset.step;
    if (step === 'what' && !s.families.length && !s.items.length) return tc('Pick a product family, or add a product by its code.');
    if (step === 'who' && s.name.length < 2) { mark('name'); return tc('Add your name, so the team knows who to reply to.'); }
    if (step === 'reply') {
      if (s.channel === 'Email' && !EMAIL.test(s.email)) { mark('email'); return tc('Add an email address for the quote.'); }
      if (s.channel !== 'Email' && s.phone.replace(/\D/g, '').length < 7) { mark('phone'); return tc('Add a phone number we can call or message.'); }
    }
    return '';
  }
  function nudge(text) {
    msg.textContent = text;
    if (!env.reduced) gsap.fromTo(steps[at], { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' });
  }
  function goNext() {
    const err = check(at);
    if (err) { nudge(err); return; }
    show(at + 1);
  }
  next.addEventListener('click', goNext);
  back.addEventListener('click', () => show(at - 1));
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || (e.target as Element).matches('textarea, [data-find], button')) return;
    e.preventDefault();
    if (at === steps.length - 1) form.requestSubmit();
    else goNext();
  });
  // a line on the label takes you back to its question
  label.querySelectorAll<HTMLElement>('[data-goto]').forEach((row) => row.addEventListener('click', () => {
    if (form.hidden) return;
    show(stepIndex(row.dataset.goto));
    if (window.innerWidth < 900) lenis?.scrollTo(form, { offset: -90, duration: 1 });
  }));

  // ── seal & send: tape over the label, then the email app ──
  function compose(s) {
    const reachLine = s.channel === 'Email' ? `Email: ${s.email}` : `Phone / WhatsApp: ${s.phone}`;
    return [
      `Enquiry ${ref}`,
      '',
      `Product families: ${s.families.join(', ') || '—'}`,
      `Products: ${describe(s.items) || '—'}`,
      `Quantity: ${[s.size, s.qty].filter(Boolean).join(' — ') || '—'}`,
      `How often: ${s.often || '—'}`,
      `Deliver to: ${[s.city, s.region].filter(Boolean).join(' — ') || '—'}`,
      '',
      `Name: ${s.name}`,
      `Company: ${s.company || '—'}`,
      `Business: ${s.trade || '—'}`,
      `Reply by: ${s.channel}`,
      reachLine,
      s.channel === 'Email' && s.phone ? `Phone / WhatsApp: ${s.phone}` : '',
      s.channel !== 'Email' && s.email ? `Email: ${s.email}` : '',
      '',
      `Notes: ${[...s.extra, s.message].filter(Boolean).join('; ') || '—'}`,
    ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  }
  let lastText = '';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    for (let i = 0; i < steps.length; i++) {
      const err = check(i);
      if (err) { show(i); nudge(err); return; }
    }
    const s = snap();
    lastText = compose(s);
    const subject = `Enquiry ${ref} — ${s.families[0] || s.items[0]?.familyName || 'Arifa Pack products'}${s.company ? ` — ${s.company}` : ''}`;
    const mail = `mailto:info@arifapack.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lastText)}`;
    label.classList.add('is-sealed');
    const finish = () => {
      window.location.href = mail;
      form.hidden = true;
      done.hidden = false;
      done.querySelector<HTMLElement>('[data-done-ref]').textContent = ref;
      if (!env.reduced) gsap.from(done.children, { y: 20, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06 });
      done.querySelector<HTMLElement>('.desk__done-title')?.setAttribute('tabindex', '-1');
      done.querySelector<HTMLElement>('.desk__done-title')?.focus({ preventScroll: true });
    };
    if (env.reduced) finish();
    else gsap.delayedCall(1.15, finish);
  });

  async function copy(text, out) {
    try {
      await navigator.clipboard.writeText(text);
      out.textContent = tc('Copied. Paste it into an email to info@arifapack.com.');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
      out.textContent = tc(ok ? 'Copied. Paste it into an email to info@arifapack.com.' : 'Couldn’t copy here. Write to info@arifapack.com and mention your enquiry number.');
    }
  }
  done.querySelector<HTMLElement>('[data-copy-enquiry]').addEventListener('click', () => copy(lastText, done.querySelector<HTMLElement>('[data-done-msg]')));
  done.querySelector<HTMLElement>('[data-restart]').addEventListener('click', () => {
    form.reset();
    picked = [];
    renderPicked();
    ref = newRef(true);
    setRef();
    Object.keys(last).forEach((k) => delete last[k]);
    label.classList.remove('is-sealed');
    done.hidden = true;
    form.hidden = false;
    update(false);
    show(0);
  });

  // the assistant can start the enquiry from what the visitor told it
  document.addEventListener('arifa:quote-fill', (e) => {
    const f: QuoteFill = (e as CustomEvent<QuoteFill>).detail || {};
    if (f.family) {
      const box = form.querySelector<HTMLInputElement>(`.pick[data-family="${f.family}"] input`) || [...form.querySelectorAll<HTMLInputElement>('input[name="family"]')].find((i) => norm(i.value) === norm(f.family));
      if (box) box.checked = true;
    }
    if (f.quantity) field('quantity').value = f.quantity;
    if (f.city) field('city').value = f.city;
    if (f.notes) field('message').value = f.notes;
    if (form.hidden) return;
    update();
    show(stepIndex('who'));
    lenis?.scrollTo('#enquiry', { duration: 1.2 });
  });

  update(false);
  show(0, { focus: false });

  // ── entrance: the headline rises, the label drops onto the desk ──
  const titleLines = document.querySelectorAll<HTMLElement>('.ct-title .ct-line > span');
  const rest = document.querySelectorAll<HTMLElement>('.ct-desk__head .eyebrow, .ct-lede, .desk');
  if (!env.reduced) {
    gsap.set(titleLines, { yPercent: 110 });
    gsap.set(rest, { opacity: 0, y: 16 });
    gsap.set(label, { opacity: 0, y: -60, rotate: -9 });
  }
  return {
    intro() {
      if (env.reduced) return;
      gsap.timeline()
        .to(titleLines, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, 0.1)
        .to(rest, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.35)
        .to(label, { opacity: 1, y: 0, rotate: 0, duration: 1.3, ease: 'back.out(1.4)' }, 0.5);
    },
  };
}
