// /products (Arabic) — the page itself is src/views/products.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { ProductsView, metadataFor, viewport as pageViewport } from '@/views/products';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('ar');
  await loadContent('products');
  return withCmsSeo(metadataFor('ar'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('ar');
  await loadContent('products');
  return <ProductsView />;
}
