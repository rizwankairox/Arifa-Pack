// One product — its own page.  Routes: src/app/(en)/products/[id] and src/app/(ar)/ar/products/[id]
// Built for every product in catalogue.json at deploy time (generateStaticParams in the route files).
import type { Viewport } from 'next';
import { JsonLd } from '@/components/site/JsonLd';
import { PageShell } from '@/components/site/PageShell';
import { getProduct, productPath } from '@/data/catalogue';
import type { Product } from '@/data/types';
import { company } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import { lh, t, type Locale } from '@/i18n';
import { CatalogueCta } from '@/sections/products/CatalogueCta';
import { ProductDetail } from '@/sections/product/ProductDetail';
import { RelatedProducts } from '@/sections/product/RelatedProducts';
// the catalogue's styles, in this order (src/styles/catalogue/)
import '@/styles/catalogue/families.css';
import '@/styles/catalogue/grid.css';
import '@/styles/catalogue/quickview.css';
import '@/styles/catalogue/tray.css';
import '@/styles/catalogue/responsive.css';
import '@/styles/product.css';

const hasCode = (p: Product) => !!p.code && p.code !== '—';

export const metadataFor = (locale: Locale, id: string) => {
  const p = getProduct(id);
  if (!p) return {};
  return pageMetadata(locale, {
    title: '{ref} {name} — {family} | Arifa Pack',
    description: hasCode(p)
      ? '{ref} {name}, catalogue code {code}{pack}. Part of the Arifa Pack {family} range, made in Al Jurf, Ajman, UAE. Add it to your enquiry list or request a quote.'
      : '{ref} {name}{pack}. Part of the Arifa Pack {family} range, made in Al Jurf, Ajman, UAE. Add it to your enquiry list or request a quote.',
    path: productPath(p.id),
    ogTitle: '{ref} {name} | Arifa Pack',
    ogDescription: '{family} · {ref}{pack}',
    ogImage: p.img || '/images/catalogue/ac-83185-n.webp',
    vars: {
      ref: p.ref,
      name: p.name,
      family: p.familyName,
      code: p.code,
      pack: p.qty ? t(', packed {qty}', { qty: p.qty }) : '',
    },
  });
};

export const viewport: Viewport = { themeColor: '#ecebe6' };

// the product, and where it sits on the site, for search engines (schema.org)
function productData(p: Product) {
  const url = `${company.siteUrl}${p.url}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${p.ref} ${p.name}`,
      url,
      ...(hasCode(p) ? { sku: p.code } : {}),
      mpn: p.ref,
      category: p.familyName,
      ...(p.img ? { image: `${company.siteUrl}${p.img}` } : {}),
      brand: { '@type': 'Brand', name: company.short },
      manufacturer: { '@type': 'Organization', name: company.name, url: `${company.siteUrl}/` },
      ...(p.qty ? { additionalProperty: [{ '@type': 'PropertyValue', name: t('Packing'), value: p.qty }] } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('Products'), item: `${company.siteUrl}${lh('/products')}` },
        { '@type': 'ListItem', position: 2, name: p.familyName, item: `${company.siteUrl}${lh(`/products?family=${p.family}`)}` },
        { '@type': 'ListItem', position: 3, name: `${p.ref} ${p.name}`, item: url },
      ],
    },
  ];
}

export function ProductView({ id }: { id: string }) {
  const p = getProduct(id);
  if (!p) return null;
  return (
    <PageShell page="product" path={productPath(p.id)} skip={{ href: '#product', label: t('Skip to the product') }}>
      {productData(p).map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <ProductDetail p={p} />
      <RelatedProducts p={p} />
      <CatalogueCta />
    </PageShell>
  );
}
