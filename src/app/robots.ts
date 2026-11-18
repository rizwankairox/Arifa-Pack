// /robots.txt — lets search engines in, and points them at the sitemap.
import type { MetadataRoute } from 'next';
import { company } from '@/data/site';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${company.siteUrl}/sitemap.xml` };
}
