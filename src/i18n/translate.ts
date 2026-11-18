// The lookup shared by the server (src/i18n/index.ts) and the browser (src/i18n/client.ts).
// English text is the key: anything without an Arabic entry simply stays in English.

export type Dict = Record<string, string>;
export type Vars = Record<string, string | number>;

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

/** patterns for text built from numbers (pack sizes, counts…) */
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(\d+) pcs × (\d+) pkt$/, (m) => `${m[1]} قطعة × ${m[2]} عبوة`],
  [/^1 × (\d+) pcs$/, (m) => `1 × ${m[1]} قطعة`],
  [/^(\d+) products?$/, (m) => (m[1] === '1' ? 'منتج واحد' : m[1] === '2' ? 'منتجان' : `${m[1]} منتجات`)],
];

/** English (no dictionary): just fill in the {gaps} */
export const english = (s: string, vars?: Vars) => (s == null ? s : fill(s, vars));

/** Arabic: the dictionary entry, else a number pattern, else the English unchanged */
export function lookup(dict: Dict, s: string, vars?: Vars): string {
  if (s == null) return s;
  const hit = dict[s] ?? dict[s.trim()];
  if (hit != null) return fill(hit, vars);
  for (const [re, fn] of PATTERNS) {
    const m = s.match(re);
    if (m) return fn(m);
  }
  return fill(s, vars);
}

/** "/products?family=foil" → "/ar/products?family=foil";  "/" → "/ar";  "/#floor" → "/ar#floor" */
export function localHref(href: string, ar: boolean): string {
  if (!ar || !href.startsWith('/') || href.startsWith('//') || href.startsWith('/ar') && /^\/ar(\/|$|[?#])/.test(href)) return href;
  if (href.startsWith('/api/') || /\.(\w{2,5})([?#]|$)/.test(href.split('?')[0])) return href; // files and the API stay put
  if (href === '/') return '/ar';
  if (/^\/[?#]/.test(href)) return '/ar' + href.slice(1);
  return '/ar' + href;
}
