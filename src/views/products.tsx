// Products — the catalogue.  Routes: src/app/(en)/… and src/app/(ar)/ar/…  (filters: ?family=foil  ?q=8325  ?p=<product id>)
import type { Viewport } from 'next';
import { JsonLd } from '@/components/site/JsonLd';
import { PageShell } from '@/components/site/PageShell';
import { getCatalogue, getStats } from '@/data/catalogue';
import { company } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import { t, type Locale } from '@/i18n';
import { Catalogue } from '@/sections/products/Catalogue';
import { CatalogueCta } from '@/sections/products/CatalogueCta';
import { CatalogueHero } from '@/sections/products/CatalogueHero';
import { EnquiryTray } from '@/sections/products/EnquiryTray';
import { QuickView } from '@/sections/products/QuickView';
// the catalogue's styles, in this order (src/styles/catalogue/)
import '@/styles/catalogue/families.css';
import '@/styles/catalogue/grid.css';
import '@/styles/catalogue/quickview.css';
import '@/styles/catalogue/tray.css';
import '@/styles/catalogue/responsive.css';

const stats = getStats();

export const metadataFor = (locale: Locale) =>
  pageMetadata(locale, {
    title: 'Products — aluminium containers, foil, platters, pots & more | Arifa Pack',
    description:
      'The Arifa Pack catalogue: {n} products across aluminium containers, foil, platters, cups & trays, pots, microwave containers, cutlery and cling film — with product codes and packing quantities.',
    path: '/products',
    ogTitle: 'Arifa Pack — Product catalogue',
    ogDescription: '{n} products, searchable by code, family and pack size.',
      vars: { n: stats.products },
    ogImage: '/images/catalogue/ac-83185-n.webp',
  });

export const viewport: Viewport = { themeColor: '#ecebe6' };

// every product, for search engines
function catalogueList() {
  const cat = getCatalogue();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Arifa Pack product catalogue',
    numberOfItems: cat.products.length,
    itemListElement: cat.products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: `${p.ref} ${p.name}`,
        ...(p.code && p.code !== '—' ? { sku: p.code } : {}),
        category: p.familyName,
        ...(p.img ? { image: `${company.siteUrl}${p.img}` } : {}),
        brand: { '@type': 'Brand', name: company.short },
      },
    })),
  };
}

export function ProductsView() {
  return (
    <PageShell
      page="products" skip={{ href: '#catalogue', label: t('Skip to the catalogue') }}
      withCatalogue
      overlays={
        <>
          <QuickView />
          <EnquiryTray />
        </>
      }
    >
      <JsonLd data={catalogueList()} />
      <CatalogueHero />
      <Catalogue />
      <CatalogueCta />
    </PageShell>
  );
}
