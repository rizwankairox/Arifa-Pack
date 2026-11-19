// /sitemap.xml — the list of pages handed to search engines, in English and Arabic (/ar/…):
// the six main pages, then one page per product.
import type { MetadataRoute } from 'next';
import { productIds, productPath } from '@/data/catalogue';
import { company } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/products', '/about', '/quality', '/clients', '/contact'];
  const entry = (p: string, priority: number) => {
    const en = `${company.siteUrl}${p}`;
    const ar = `${company.siteUrl}/ar${p}`;
    const alternates = { languages: { en, ar } };
    return [
      { url: en, changeFrequency: 'monthly' as const, priority, alternates },
      { url: ar, changeFrequency: 'monthly' as const, priority, alternates },
    ];
  };
  return [
    ...pages.flatMap((p) => entry(p, p === '' ? 1 : 0.8)),
    ...productIds().flatMap((id) => entry(productPath(id), 0.6)),
  ];
}
