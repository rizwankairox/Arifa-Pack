/*
  The content the page being rendered shows: from the Arifa CMS when it is connected, otherwise from
  the site's own files (src/data/). This is where the pages meet the CMS reader (src/lib/arifaContent.ts).

  Each route awaits loadContent() once, before rendering:

    setLocale('en');
    await loadContent('home');        // site settings, this page's blocks, families, products, collections

  Everything below it then reads synchronously, as before:

    getCatalogue()                    (src/data/catalogue.ts)  CMS families + products, or catalogue.json
    getClients()                      (src/data/clients.ts)    CMS industries / clients / stories, or clients.json
    company, phone                    (src/data/site.ts)       CMS phones, email, address, hours, or site.ts
    pageBlock('intro')  <CmsText>     this page's section text from the CMS (null → the section's own text)
    cmsCollection('leadership')       any other collection's items (null → the section's own list)

  If the CMS is off (no ARIFA_CONTENT_URL / NEXT_PUBLIC_ARIFA_API_URL), unreachable, or a document is
  missing, each reader returns null and that part of the page keeps its own text: the site never
  goes blank because of the CMS.
*/
import 'server-only';
import { cache } from 'react';
import {
  blockOf, contentEnabled, getCollection, getFamilies, getPage, getProducts, getSite,
  type Block, type ContentDoc, type ContentList, type Locale,
} from './arifaContent';
import { getLocale } from '@/i18n/locale';
import { t } from '@/i18n';
import { applySite } from '@/data/site';

/** the collections every page may draw on (clients page, enquiry desk, about, home tour, quality) */
const COLLECTIONS = ['industries', 'clients', 'stories', 'leadership', 'tour_chapters', 'stations', 'certificates', 'faqs'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

type Store = {
  page: string | null;
  pageDoc: ContentDoc<{ blocks?: Block[] }> | null;
  site: ContentDoc | null;
  families: ContentList | null;
  /** the products in the page's language, and in English (for English search on /ar pages) */
  products: ContentDoc[] | null;
  productsEn: ContentDoc[] | null;
  collections: Partial<Record<CollectionName, ContentList | null>>;
};

/*
  The CMS's photos of files this site already has are written as the site's own address
  (https://www.arifapack.com/images/catalogue/ac-8325.webp). Those are made relative
  (/images/catalogue/ac-8325.webp), so they load from wherever the site runs (local, preview,
  live) and keep their AVIF and phone-size copies. Photos on the CMS's media store stay as they are.
*/
const OWN_HOSTS = new Set(['arifapack.com', 'www.arifapack.com']);
function ownToRelative<T>(v: T): T {
  if (Array.isArray(v)) return v.map(ownToRelative) as T;
  if (!v || typeof v !== 'object') return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if ((k === 'src' || k === 'url') && typeof x === 'string') {
      try {
        const u = new URL(x);
        out[k] = OWN_HOSTS.has(u.hostname) && /^\/(images|media|docs)\//.test(u.pathname) ? u.pathname : x;
      } catch {
        out[k] = x;
      }
    } else out[k] = ownToRelative(x);
  }
  return out as T;
}

const store = cache((): Store => ({ page: null, pageDoc: null, site: null, families: null, products: null, productsEn: null, collections: {} }));

/** every product, trade and self range, once each, in catalogue order */
async function allProducts(locale: Locale): Promise<ContentDoc[] | null> {
  // the unfiltered list already holds both ranges (78: trade and self); the self range is asked for
  // separately only if a backend ever leaves it out
  const all = await getProducts({ locale });
  if (all?.items.some((d) => (d.data as { range?: string }).range === 'self')) return all.items;
  const self = await getProducts({ locale, range: 'self' });
  if (!all && !self) return null;
  const seen = new Set<string>();
  return [...(all?.items || []), ...(self?.items || [])].filter((d) => !seen.has(d.key) && seen.add(d.key));
}

/**
 * Fetch what this page needs from the CMS (all reads cached and tagged: src/lib/arifaContent.ts).
 * Call once per route, after setLocale(); repeated calls in the same request share one fetch.
 */
export const loadContent = cache(async (page: string, locale: Locale = getLocale()) => {
  const s = store();
  s.page = page;
  if (!contentEnabled()) return s;
  const [site, siteEn, pageDoc, families, products, productsEn, ...lists] = await Promise.all([
    getSite(locale),
    locale === 'en' ? null : getSite('en'),
    getPage(page, locale) as Promise<ContentDoc<{ blocks?: Block[] }> | null>,
    getFamilies(locale),
    allProducts(locale),
    locale === 'en' ? null : allProducts('en'),
    ...COLLECTIONS.map((c) => getCollection(c, locale)),
  ]);
  Object.assign(s, ownToRelative({ site, pageDoc, families, products, productsEn: productsEn ?? products }));
  COLLECTIONS.forEach((c, i) => (s.collections[c] = ownToRelative(lists[i])));
  // phones, email, address, hours: shared by every visitor, so taken from the English document
  const en = locale === 'en' ? site : siteEn;
  if (en) applySite(en.data);
  return s;
});

/** the CMS catalogue for this request, or null (then catalogue.json is used) */
export function cmsCatalogue() {
  const s = store();
  if (!s.families?.items.length || !s.products?.length) return null;
  return { families: s.families.items, products: s.products, productsEn: s.productsEn || s.products };
}

/** the CMS items of one collection for this request, or null (then the section keeps its own list) */
export function cmsCollection<T = Record<string, any>>(name: CollectionName): (T & { key: string })[] | null {
  const list = store().collections[name];
  if (!list?.items.length) return null;
  // on /ar, each untranslated text field (the CMS sends the English) uses the site's own Arabic when there is one
  const ar = getLocale() === 'ar';
  const tr = (v: unknown): unknown => (typeof v === 'string' ? t(v) : Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? t(x) : x)) : v);
  const KEEP = new Set(['kit', 'families', 'industry', 'trade', 'kind', 'family', 'valid_until']); // ids and values matched by the site, never translated
  return list.items.map((d) => {
    const data = d.data as Record<string, unknown>;
    const out = ar ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, KEEP.has(k) ? v : tr(v)])) : data;
    return { ...(out as T), key: d.key };
  });
}

/** this page's block for one section (its DOM id), or null */
export const pageBlock = (sectionId: string): Block | null => blockOf(store().pageDoc, sectionId);

/** one text field of this page's section from the CMS, or null */
export function blockText(sectionId: string, field: 'eyebrow' | 'heading' | 'body'): string | null {
  const v = pageBlock(sectionId)?.[field];
  if (typeof v !== 'string' || !v.trim()) return null;
  // the site shows no section numbers: an eyebrow that is only one ("(01)", "02") keeps the site's own label
  if (field === 'eyebrow' && /^\(?\s*\d{1,2}\s*\)?\.?$/.test(v.trim())) return null;
  // on /ar, text the CMS has no Arabic for yet (it sends the English) uses the site's own Arabic when there is one
  return getLocale() === 'ar' ? t(v) : v;
}

/** the CMS site settings document for this request (theme, announcement, assistant texts), or null */
export const cmsSite = () => store().site?.data ?? null;

/** the page's SEO fields from the CMS (title, description), or null */
export function cmsSeo(): { title?: string; description?: string; share_image?: { src?: string } | null; noindex?: boolean } | null {
  const d = store().pageDoc?.data as Record<string, any> | undefined;
  return (d?.seo as Record<string, any>) || (d?.title ? { title: d.title, description: d.description } : null);
}

/** a page's metadata with the CMS SEO title and description laid over it, when the CMS has them */
export function withCmsSeo<M extends { title?: unknown; description?: unknown; openGraph?: unknown; robots?: unknown }>(m: M): M {
  const seo = cmsSeo();
  const image = seo?.share_image?.src;
  if (!seo?.title && !seo?.description && !image && !seo?.noindex) return m;
  const og = (m.openGraph || {}) as Record<string, unknown>;
  return {
    ...m,
    ...(seo.title ? { title: seo.title } : {}),
    ...(seo.description ? { description: seo.description } : {}),
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      ...og,
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}
