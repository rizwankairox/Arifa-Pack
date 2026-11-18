// Ajman runs on Gulf Standard Time (UTC+4, no DST).
// Published hours: Monday–Saturday 08:00–20:00, Sunday closed.
import { tc } from '@/i18n/client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ajmanNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 4 * 3600000);
}

export function status(d: Date): { open: boolean; next: string } {
  const day = d.getDay();
  const mins = d.getHours() * 60 + d.getMinutes();
  const open = day !== 0 && mins >= 8 * 60 && mins < 20 * 60;
  let next = '';
  if (!open) {
    // next opening: today 08:00 if before 8 on Mon–Sat, else the next working day
    let nd = day,
      beforeOpen = mins < 8 * 60 && day !== 0;
    if (!beforeOpen) {
      nd = (day + 1) % 7;
      if (nd === 0) nd = 1;
    }
    next = beforeOpen ? tc('today 08:00') : `${tc(DAYS[nd])} 08:00`;
  }
  return { open, next };
}

export function initClock() {
  const clock = document.querySelector<HTMLElement>('[data-clock]');
  const wrap = document.querySelector<HTMLElement>('[data-status]');
  const state = document.querySelector<HTMLElement>('[data-open-state]');
  const tick = () => {
    const d = ajmanNow();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const s = status(d);
    if (clock) clock.textContent = `${tc('Ajman')} ${hh}:${mm} · ${tc(s.open ? 'Open' : 'Closed')}`;
    wrap?.classList.toggle('is-open', s.open);
    if (state) {
      state.innerHTML = `<i class="dot ${s.open ? 'is-open' : ''}"></i>${s.open ? tc('Open now') : tc('Closed · opens {next}', { next: s.next })} — ${hh}:${mm} ${tc('GST')}`;
    }
  };
  tick();
  setInterval(tick, 20000);
}
