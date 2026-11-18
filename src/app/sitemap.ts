// /sitemap.xml — the list of pages handed to search engines, in English and Arabic (/ar/…).
import type { MetadataRoute } from 'next';
import { company } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/products', '/about', '/quality', '/clients', '/contact'];
  return pages.flatMap((p) => {
    const en = `${company.siteUrl}${p}`;
    const ar = `${company.siteUrl}/ar${p}`;
    const alternates = { languages: { en, ar } };
    const priority = p === '' ? 1 : 0.8;
    return [
      { url: en, changeFrequency: 'monthly' as const, priority, alternates },
      { url: ar, changeFrequency: 'monthly' as const, priority, alternates },
    ];
  });
}
