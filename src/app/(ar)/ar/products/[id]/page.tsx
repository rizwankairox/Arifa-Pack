// /ar/products/<id> (Arabic) — one page per product, built at deploy time. The page itself is src/views/product.tsx.
import { notFound } from 'next/navigation';
import { setLocale } from '@/i18n';
import { getProduct, productIds } from '@/data/catalogue';
import { ProductView, metadataFor, viewport as pageViewport } from '@/views/product';

type Props = { params: Promise<{ id: string }> };

// only the products in catalogue.json have pages; any other address is a 404
export const dynamicParams = false;
export const generateStaticParams = () => productIds().map((id) => ({ id }));

export async function generateMetadata({ params }: Props) {
  setLocale('ar');
  return metadataFor('ar', (await params).id);
}
export const viewport = pageViewport;

export default async function Page({ params }: Props) {
  setLocale('ar');
  const { id } = await params;
  if (!getProduct(id)) notFound();
  return <ProductView id={id} />;
}
