/*
  The product catalogue, read from catalogue.json on the server when pages are built.

  To add or change a product, edit catalogue.json. To give a product its photo, put
  public/images/catalogue/<product id>.webp in place — it is picked up automatically
  (products without one show "Photo to follow").

  Every product has its own page on this site: /products/<product id> (src/views/product.tsx).
  Nothing links to the previous arifapack.com site.

  The Arifa self range (range "self" in catalogue.json: the old site's "Our Self Range Products",
  category.php → sr-alu-con.php, sr-alu-pla.php, sr-alu-pot.php, sr-pla-con.php; codes ARF-…) is
  a separate collection of packet packs of trade products. As on the old site it is kept apart
  from the main catalogue: the grid shows it behind the "Self range" switch, and it isn't in the
  family counts or totals. Each pack also links to the trade product it packs, and back.
*/
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import raw from './catalogue.json';
import type { Catalogue, ClientCatalogue, Family, PackLink, Product, ProductEntry } from './types';
import type { FamilyInfo } from '@/assistant/types';
import { getLocale, lh, t, type Locale } from '@/i18n';


/** the families made of aluminium, as named in the catalogue itself */
export const ALU_FAMILIES = new Set(['containers', 'foil', 'platters', 'cups-trays', 'pots']);

const cached: Partial<Record<Locale, Catalogue>> = {};

/** the catalogue in the language of the page being rendered (names, blurbs and pack sizes translated; codes untouched) */
export function getCatalogue(): Catalogue {
  const locale = getLocale();
  if (cached[locale]) return cached[locale]!;
  if (locale === 'ar') {
    const en = englishCatalogue();
    const families = en.families.map((f) => ({ ...f, name: t(f.name), short: t(f.short), blurb: t(f.blurb) }));
    const link = (l: PackLink): PackLink => ({ ...l, name: t(l.name), qty: t(l.qty), url: lh(l.url) });
    const ar = (p: Product): Product => ({
      ...p, nameEn: p.name, name: t(p.name), qty: t(p.qty), familyName: t(p.familyName), url: lh(p.url),
      pack: p.pack ? link(p.pack) : p.pack, ...(p.trade ? { trade: p.trade.map(link) } : {}),
    });
    return (cached.ar = { families, products: en.products.map(ar), packs: en.packs.map(ar) });
  }
  return (cached.en = englishCatalogue());
}

let english: Catalogue | null = null;
function englishCatalogue(): Catalogue {
  if (english) return english;
  const families = raw.families as Family[];
  const imgDir = path.join(process.cwd(), 'public/images/catalogue');
  const all: Product[] = (raw.products as ProductEntry[]).map((p) => ({
    ...p,
    range: p.range || 'trade',
    img: fs.existsSync(path.join(imgDir, `${p.id}.webp`)) ? `/images/catalogue/${p.id}.webp` : null,
    url: productPath(p.id),
    familyName: families.find((f) => f.id === p.family)?.name || p.family,
  }));
  const link = (p: Product): PackLink => ({ id: p.id, ref: p.ref, name: p.name, code: p.code, qty: p.qty, url: p.url });
  const packs = all.filter((p) => p.range === 'self');
  const products = all.filter((p) => p.range !== 'self').map((p) => {
    const pack = packs.find((k) => k.packOf?.includes(p.id));
    return { ...p, pack: pack ? link(pack) : null };
  });
  packs.forEach((k) => { k.trade = (k.packOf || []).map((id) => products.find((p) => p.id === id)).filter(Boolean).map(link); });
  english = { families, products, packs };
  return english;
}

export const productsIn = (cat: Catalogue, familyId: string) => cat.products.filter((p) => p.family === familyId);
/** the self-range packs of one family */
export const packsIn = (cat: Catalogue, familyId: string) => cat.packs.filter((p) => p.family === familyId);

/** a product's own page, in English (lh() adds /ar on Arabic pages) */
export const productPath = (id: string) => `/products/${id}`;

/** every product id: the product pages built at deploy time */
export const productIds = () => (raw.products as ProductEntry[]).map((p) => p.id);

/** one product by its id, in the page's language (undefined if there is no such product) */
export const getProduct = (id: string, cat: Catalogue = getCatalogue()) => cat.products.find((p) => p.id === id) || cat.packs.find((p) => p.id === id);

/** up to `n` other products for a product page: the same family first, the same range before the other */
export function relatedProducts(p: Product, n = 4, cat: Catalogue = getCatalogue()): Product[] {
  const same = productsIn(cat, p.family).filter((o) => o.id !== p.id);
  same.sort((a, b) => Number(b.range === p.range) - Number(a.range === p.range));
  return same.slice(0, n);
}

/** the product before and after this one in the catalogue order (for previous / next links) */
export function neighbours(p: Product, cat: Catalogue = getCatalogue()) {
  // (a pack isn't listed: it steps through the list from its trade product)
  const i = cat.products.findIndex((o) => o.id === (p.range === 'self' ? p.trade?.[0]?.id : p.id));
  if (i < 0) return { prev: null, next: null };
  if (p.range === 'self') return { prev: cat.products[i], next: cat.products[i + 1] || null };
  return { prev: i > 0 ? cat.products[i - 1] : null, next: i < cat.products.length - 1 ? cat.products[i + 1] : null };
}

/** the numbers quoted on the pages */
export function getStats(cat: Catalogue = getCatalogue()) {
  return {
    products: cat.products.length,
    families: cat.families.length,
    self: cat.packs.length,
    alu: cat.products.filter((p) => ALU_FAMILIES.has(p.family)).length,
    other: cat.products.filter((p) => !ALU_FAMILIES.has(p.family)).length,
  };
}

/** the catalogue as sent to the browser (for filtering, the quick view and the enquiry desk) */
export function getClientCatalogue(cat: Catalogue = getCatalogue()): ClientCatalogue {
  return {
    families: cat.families,
    products: [...cat.products, ...cat.packs].map(({ id, family, range, ref, name, nameEn, code, qty, img, url, familyName, pack }) => ({
      id,
      family,
      range,
      ref,
      name,
      ...(nameEn ? { nameEn } : {}),
      code,
      qty,
      img,
      url,
      familyName,
      ...(pack ? { pack } : {}),
    })),
  };
}

/** the assistant's vocabulary: every family with its live product count */
export function getFamilyInfo(cat: Catalogue = getCatalogue()): FamilyInfo[] {
  return cat.families.map((f) => ({ id: f.id, name: f.name, short: f.short, count: productsIn(cat, f.id).length }));
}

