// /products (Arabic) — the page itself is src/views/products.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { ProductsView, metadataFor, viewport as pageViewport } from '@/views/products';

export const metadata = metadataFor('ar');
export const viewport = pageViewport;

export default function Page() {
  setLocale('ar');
  return <ProductsView />;
}
