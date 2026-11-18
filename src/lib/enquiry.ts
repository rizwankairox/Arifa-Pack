/*
  The enquiry list: products a visitor wants quoted, kept across pages in localStorage.
  Items carry what the quote form needs, so the home page doesn't need the catalogue.
*/

export type EnquiryItem = {
  id: string;
  ref: string;
  name: string;
  code?: string;
  img?: string | null;
  familyName?: string;
};

type Listener = (items: EnquiryItem[]) => void;

const KEY = 'arifa-enquiry';
const subs = new Set<Listener>();

function read(): EnquiryItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
let items = read();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode */
  }
  subs.forEach((fn) => fn(items));
}

export const enquiry = {
  list: () => items.slice(),
  has: (id: string) => items.some((i) => i.id === id),
  add(p: EnquiryItem) {
    if (this.has(p.id)) return;
    items.push({ id: p.id, ref: p.ref, name: p.name, code: p.code, img: p.img, familyName: p.familyName });
    save();
  },
  remove(id: string) {
    items = items.filter((i) => i.id !== id);
    save();
  },
  toggle(p: EnquiryItem) {
    if (this.has(p.id)) this.remove(p.id);
    else this.add(p);
    return this.has(p.id);
  },
  clear() {
    items = [];
    save();
  },
  subscribe(fn: Listener) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

// other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      items = read();
      subs.forEach((fn) => fn(items));
    }
  });
}

/** "8325 (AC-1) · 83185 N (AC-5)" for the quote form */
export function describe(list: EnquiryItem[] = items) {
  return list.map((i) => `${i.ref} ${i.name}${i.code && i.code !== '—' ? ` (${i.code})` : ''}`).join('; ');
}
