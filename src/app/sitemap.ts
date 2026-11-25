// /sitemap.xml — the list of pages handed to search engines, in English and Arabic (/ar/…).
// From the CMS when it is connected (GET /v1/content/sitemap: every published page, family and product,
// refreshed with the "sitemap" tag); otherwise the six main pages, then one page per product in catalogue.json.
import type { MetadataRoute } from 'next';
import { productIds, productPath } from '@/data/catalogue';
import { company } from '@/data/site';
import { getSitemap } from '@/lib/arifaContent';

export const revalidate = 3600;

const PRIORITY = { page: 0.8, family: 0.7, product: 0.6 } as const;

function entry(en: string, ar: string, priority: number, lastModified?: string | null) {
  const urlEn = `${company.siteUrl}${en === '/' ? '' : en}`;
  const urlAr = `${company.siteUrl}${ar}`;
  const alternates = { languages: { en: urlEn, ar: urlAr } };
  const common = { changeFrequency: 'monthly' as const, priority, alternates, ...(lastModified ? { lastModified } : {}) };
  return [{ url: urlEn, ...common }, { url: urlAr, ...common }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cms = await getSitemap();
  if (cms?.length) {
    // the CMS lists product pages only once its product_pages switch is on; the site has them already,
    // so any product page it leaves out is added from the catalogue
    const listed = new Set(cms.map((e) => e.path_en));
    const products = productIds().filter((id) => !listed.has(productPath(id)));
    return [
      ...cms.flatMap((e) => entry(e.path_en, e.path_ar, e.path_en === '/' ? 1 : PRIORITY[e.kind] ?? 0.6, e.updated_at)),
      ...products.flatMap((id) => entry(productPath(id), `/ar${productPath(id)}`, 0.6)),
    ];
  }
  const pages = ['', '/products', '/about', '/quality', '/clients', '/contact'];
  return [
    ...pages.flatMap((p) => entry(p || '/', `/ar${p}`, p === '' ? 1 : 0.8)),
    ...productIds().flatMap((id) => entry(productPath(id), `/ar${productPath(id)}`, 0.6)),
  ];
}
