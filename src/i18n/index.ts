/*
  Translating the pages (server side).

    t('Request a quote')            → 'اطلب عرض سعر' on /ar pages, unchanged on English pages
    t('{n} products', { n: 78 })    → fills the {n}
    lh('/products')                 → '/ar/products' on /ar pages

  The Arabic text lives in src/i18n/ar.ts, keyed by the English. The browser's scripts use the
  same idea through src/i18n/client.ts.
*/
import { ar } from './ar';
import { getLocale, type Locale } from './locale';
import { english, localHref, lookup, type Vars } from './translate';

export { getLocale, setLocale, type Locale } from './locale';

export const isAr = () => getLocale() === 'ar';

export function t(s: string, vars?: Vars): string {
  return getLocale() === 'ar' ? lookup(ar, s, vars) : english(s, vars);
}

/** a link to another page of the site, in the same language */
export const lh = (href: string) => localHref(href, isAr());

/** the same page in the other language (for the language switch and hreflang) */
export function altPath(path: string, to: Locale): string {
  const bare = path.replace(/^\/ar(?=\/|$)/, '') || '/';
  return to === 'ar' ? localHref(bare, true) : bare;
}

/** translate the listed text fields of every object in a list */
export function tFields<T extends Record<string, unknown>>(list: T[], keys: (keyof T)[]): T[] {
  if (!isAr()) return list;
  return list.map((o) => {
    const c = { ...o };
    for (const k of keys) if (typeof c[k] === 'string') (c as Record<keyof T, unknown>)[k] = t(c[k] as string);
    return c;
  });
}
