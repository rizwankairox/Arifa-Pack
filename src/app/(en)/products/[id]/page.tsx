// /products/<id> — one page per product, built at deploy time. The page itself is src/views/product.tsx.
import { notFound } from 'next/navigation';
import { setLocale } from '@/i18n';
import { loadContent } from '@/lib/content';
import { getProduct, productIds } from '@/data/catalogue';
import { ProductView, metadataFor, viewport as pageViewport } from '@/views/product';

type Props = { params: Promise<{ id: string }> };

// the products in catalogue.json are built at deploy time; a product added in the CMS later is built
// on its first visit (dynamicParams). An id that is in neither is a 404.
export const dynamicParams = true;
export const generateStaticParams = () => productIds().map((id) => ({ id }));

export async function generateMetadata({ params }: Props) {
  setLocale('en');
  await loadContent('products');
  return metadataFor('en', (await params).id);
}
export const viewport = pageViewport;

export default async function Page({ params }: Props) {
  setLocale('en');
  await loadContent('products');
  const { id } = await params;
  if (!getProduct(id)) notFound();
  return <ProductView id={id} />;
}
