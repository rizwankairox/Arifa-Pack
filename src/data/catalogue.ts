/*
  The product catalogue, read from catalogue.json on the server when pages are built.

  To add or change a product, edit catalogue.json. To give a product its photo, put
  public/images/catalogue/<product id>.webp in place — it is picked up automatically
  (products without one show "Photo to follow").
*/
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import raw from './catalogue.json';
import type { Catalogue, ClientCatalogue, Family, ProductEntry } from './types';
import type { FamilyInfo } from '@/assistant/types';
import { getLocale, t, type Locale } from '@/i18n';

const LIVE = 'https://www.arifapack.com/';

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
    const products = en.products.map((p) => ({ ...p, nameEn: p.name, name: t(p.name), qty: t(p.qty), familyName: t(p.familyName) }));
    return (cached.ar = { families, products });
  }
  return (cached.en = englishCatalogue());
}

let english: Catalogue | null = null;
function englishCatalogue(): Catalogue {
  if (english) return english;
  const families = raw.families as Family[];
  const imgDir = path.join(process.cwd(), 'public/images/catalogue');
  const products = (raw.products as ProductEntry[]).map((p) => ({
    ...p,
    range: p.range || 'trade',
    img: fs.existsSync(path.join(imgDir, `${p.id}.webp`)) ? `/images/catalogue/${p.id}.webp` : null,
    live: LIVE + p.href,
    familyName: families.find((f) => f.id === p.family)?.name || p.family,
  }));
  english = { families, products };
  return english;
}

export const productsIn = (cat: Catalogue, familyId: string) => cat.products.filter((p) => p.family === familyId);

/** the numbers quoted on the pages */
export function getStats(cat: Catalogue = getCatalogue()) {
  return {
    products: cat.products.length,
    families: cat.families.length,
    self: cat.products.filter((p) => p.range === 'self').length,
    alu: cat.products.filter((p) => ALU_FAMILIES.has(p.family)).length,
    other: cat.products.filter((p) => !ALU_FAMILIES.has(p.family)).length,
  };
}

/** the catalogue as sent to the browser (for filtering, the quick view and the enquiry desk) */
export function getClientCatalogue(cat: Catalogue = getCatalogue()): ClientCatalogue {
  return {
    families: cat.families,
    products: cat.products.map(({ id, family, range, ref, name, nameEn, code, qty, img, live, familyName }) => ({
      id,
      family,
      range,
      ref,
      name,
      ...(nameEn ? { nameEn } : {}),
      code,
      qty,
      img,
      live,
      familyName,
    })),
  };
}

/** the assistant's vocabulary: every family with its live product count */
export function getFamilyInfo(cat: Catalogue = getCatalogue()): FamilyInfo[] {
  return cat.families.map((f) => ({ id: f.id, name: f.name, short: f.short, count: productsIn(cat, f.id).length }));
}

