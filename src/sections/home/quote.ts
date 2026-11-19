// Home · the quote form at the foot of the page → a prefilled email (no backend yet).
import { enquiry, describe } from '@/lib/enquiry';
import { tc } from '@/i18n/client';
import { company } from '@/data/site';

// ── Quote form → prefilled email (no backend yet) ──
export function initQuote() {
  const form = document.querySelector<HTMLFormElement>('[data-quote]');
  if (!form) return;
  const note = form.querySelector<HTMLElement>('[data-quote-note]');
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;

  // carry over the enquiry list built on the products page
  const picked = enquiry.list();
  if (picked.length) {
    const detail = field('detail');
    if (!detail.value) detail.value = describe(picked);
    const fams = new Set(picked.map((i) => i.familyName));
    form.querySelectorAll<HTMLInputElement>('input[name="family"]').forEach((c) => { if (fams.has(c.value)) c.checked = true; });
    note.textContent = tc('{n} from your enquiry list added above. Opens your email app, addressed to {email}.', { email: company.email, n: tc(`${picked.length} product${picked.length > 1 ? 's' : ''}`) });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let ok = true;
    ['name', 'email'].forEach((n) => {
      const input = field(n);
      const valid = n === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()) : input.value.trim().length > 1;
      input.closest<HTMLElement>('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      note.textContent = tc('Please add your name and a valid email so we can reply.');
      form.querySelector<HTMLInputElement>('.is-invalid input')?.focus();
      return;
    }
    const families = data.getAll('family');
    const lines = [
      `Product families: ${families.join(', ') || '—'}`,
      `Product / code: ${data.get('detail') || '—'}`,
      `Approx. quantity (cartons): ${data.get('quantity') || '—'}`,
      `Delivery: ${data.get('city') || '—'}`,
      '',
      `Name: ${data.get('name')}`,
      `Company: ${data.get('company') || '—'}`,
      `Phone / WhatsApp: ${data.get('phone') || '—'}`,
      `Email: ${data.get('email')}`,
      '',
      `${data.get('message') || ''}`,
    ];
    const subject = `Quote request — ${families[0] || 'Arifa Pack products'}${data.get('company') ? ` — ${data.get('company')}` : ''}`;
    window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    form.classList.add('is-sent');
    note.textContent = tc('Your email app should open with the request filled in. If it doesn’t, write to {email}.', { email: company.email });
  });
  form.querySelectorAll<HTMLInputElement>('input').forEach((i) => i.addEventListener('input', () => i.closest<HTMLElement>('.field')?.classList.remove('is-invalid')));
}

