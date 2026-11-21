// /products — the page itself is src/views/products.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { ProductsView, metadataFor, viewport as pageViewport } from '@/views/products';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('en');
  await loadContent('products');
  return withCmsSeo(metadataFor('en'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('en');
  await loadContent('products');
  return <ProductsView />;
}
