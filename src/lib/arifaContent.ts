/*
  The Arifa CMS, read side: GET /v1/content/* (hand-off: CMS_API.md). Server only.

  This is the connection to the content the client team edits (text, products, photos, contacts).
  The pages read it through src/lib/content.ts (loadContent, once per route), falling back to the
  files in src/data/ for anything the CMS doesn't send. What each reader feeds:

    getSite()                   ← src/data/site.ts        contacts, hours, colours, the assistant's texts
    getPage(slug)               ← each page's section text (one block per section id)
    getFamilies()               ← catalogue.json families
    getProducts({ family, q, range })  ← catalogue.json products
    getProduct(id)              ← one product + its family, previous / next, four more
    getCollection(name)         ← clients.json, tour chapters, stations, certificates, FAQs, leadership
    getManifest()               the site map the assistant uses
    getSitemap(), getRedirects() ← src/app/sitemap.ts, the old-site redirects in next.config.ts

  Freshness: every read is cached and tagged (site, pages:<slug>, families, products, products:<id>,
  family:<id>, manifest, sitemap, <collection>). When an editor publishes, the backend calls
  /api/revalidate (src/app/api/revalidate/route.ts) with the tags to refresh, so the change shows
  within about a minute; `revalidate: 60` heals a missed call on its own.

  Preview: in Next.js draft mode (opened by /api/draft) reads carry the editor's preview token and
  are never cached, so unpublished drafts show on the real site.

  Switched on by ARIFA_CONTENT_URL (server only), or NEXT_PUBLIC_ARIFA_API_URL when the content API
  is on the same backend (it is, by default). Without either, every reader returns null and the
  pages keep their own files.
*/
import 'server-only';
import { cookies, draftMode } from 'next/headers';

const BASE = (process.env.ARIFA_CONTENT_URL || process.env.NEXT_PUBLIC_ARIFA_API_URL || '').replace(/\/+$/, '');
export const PREVIEW_COOKIE = 'arifa-preview';

export const contentEnabled = () => !!BASE;

export type Locale = 'en' | 'ar';

/** a media field, completed by the API: an absolute URL, alt text in the page's language, size */
export type Media = { asset_id?: string; url?: string; src: string; alt?: string; width?: number; height?: number; content_type?: string };

/** one published document in one language; `data` follows its collection's schema (CMS_API.md §3) */
export type ContentDoc<T = Record<string, any>> = {
  collection: string;
  key: string;
  version: number;
  published_at: string | null;
  data: T;
  draft?: boolean;
};
export type ContentList<T = Record<string, any>> = { collection: string; locale: Locale; revision: number; items: ContentDoc<T>[] };

/** a page section: its DOM id is a contract with the site and the assistant (never rename one) */
export type Block = {
  section_id: string;
  design_id?: string;
  kind?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  media?: Media[];
  items?: { title?: string; text?: string; media?: Media; link?: string; data?: Record<string, any> }[];
  buttons?: { label: string; href: string }[];
  keywords?: string[];
  data?: Record<string, any>;
  hidden?: boolean;
};
export type ProductLink = { key: string; ref: string; name: string };
export type ProductDetail = {
  product: ContentDoc;
  family: ContentDoc | null;
  previous: ProductLink | null;
  next: ProductLink | null;
  more_from_family: ContentDoc[];
};
export type SitemapEntry = { path_en: string; path_ar: string; updated_at: string | null; kind: 'page' | 'product' | 'family' };
export type Redirect = { source: string; destination: string; permanent?: boolean };
export type SiteManifest = {
  revision: number;
  built_at: string;
  pages: { key: string; title: string; path_en: string; path_ar: string; sections: { id: string; title?: string; keywords?: string[] }[] }[];
  families: { id: string; name: string; synonyms?: Record<string, string[]>; path_en?: string; path_ar?: string }[];
  products: { id: string; ref: string; catalogue_code?: string | null; family: string; name: string; packing?: string | null; range?: 'trade' | 'self'; path_en?: string; path_ar?: string; has_photo?: boolean }[];
  chapters: { id: string; title: string; seconds?: number; family?: string | null }[];
  product_pages: boolean;
};

// the editor's preview token, while draft mode is on (set by /api/draft)
async function previewToken(): Promise<string | null> {
  try {
    if (!(await draftMode()).isEnabled) return null;
    return (await cookies()).get(PREVIEW_COOKIE)?.value || null;
  } catch {
    return null; // (outside a request, e.g. while building: published content)
  }
}

const warned = new Set<string>();

/** one GET on the content API: cached and tagged, or fresh in preview. null when off or failing. */
async function get<T>(path: string, params: Record<string, string | null | undefined>, tags: string[]): Promise<T | null> {
  if (!BASE) return null;
  const preview = await previewToken();
  const q = new URLSearchParams();
  Object.entries({ ...params, preview }).forEach(([k, v]) => { if (v) q.set(k, v); });
  const url = `${BASE}${path}${q.size ? `?${q}` : ''}`;
  try {
    const r = await fetch(url, preview ? { cache: 'no-store' } : { next: { revalidate: 60, tags } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`${r.status}`);
    return (await r.json()) as T;
  } catch (e) {
    // (said once per address, not once per page that reads it)
    if (!warned.has(path)) {
      warned.add(path);
      console.warn(`Arifa content: ${path} unavailable (${(e as Error).message}); using the site's own files.`);
    }
    return null;
  }
}

export const getSite = (locale: Locale = 'en') =>
  get<ContentDoc>('/v1/content/site', { locale }, ['site']);

export const getPage = (slug: string, locale: Locale = 'en') =>
  get<ContentDoc<{ title?: string; path?: string; blocks?: Block[]; seo?: Record<string, any>; faqs?: any[] }>>(
    `/v1/content/pages/${encodeURIComponent(slug)}`, { locale }, [`pages:${slug}`]);

export const getFamilies = (locale: Locale = 'en') =>
  get<ContentList>('/v1/content/families', { locale }, ['families']);

export const getProducts = ({ locale = 'en', family, q, range }: { locale?: Locale; family?: string; q?: string; range?: 'trade' | 'self' } = {}) =>
  get<ContentList>('/v1/content/products', { locale, family, q, range }, ['products', ...(family ? [`family:${family}`] : [])]);

export const getProduct = (id: string, locale: Locale = 'en') =>
  get<ProductDetail>(`/v1/content/products/${encodeURIComponent(id)}`, { locale }, [`products:${id}`, 'products']);

/** tour_chapters, stations, faqs, certificates, clients, industries, stories, leadership */
export const getCollection = (name: string, locale: Locale = 'en') =>
  get<ContentList>(`/v1/content/collections/${encodeURIComponent(name)}`, { locale }, [name]);

export const getManifest = () => get<SiteManifest>('/v1/content/manifest', {}, ['manifest']);
export const getSitemap = () => get<SitemapEntry[]>('/v1/content/sitemap', {}, ['sitemap']);
export const getRedirects = () => get<Redirect[]>('/v1/content/redirects', {}, ['redirects']);

/** a page's section by its DOM id (CMS_API.md §3: the ids are a contract with the assistant) */
export const blockOf = (page: ContentDoc<{ blocks?: Block[] }> | null, sectionId: string) =>
  page?.data?.blocks?.find((b) => b.section_id === sectionId && !b.hidden) || null;
