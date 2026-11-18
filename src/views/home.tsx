// Home — the Digital Factory.  Routes: src/app/(en)/… and src/app/(ar)/ar/…
import type { Viewport } from 'next';
import { JsonLd } from '@/components/site/JsonLd';
import { PageShell } from '@/components/site/PageShell';
import { company } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n';
import { FactoryFloor } from '@/sections/home/FactoryFloor';
import { FilmPlayer } from '@/sections/home/FilmPlayer';
import { Hero } from '@/sections/home/Hero';
import { Intro } from '@/sections/home/Intro';
import { ProductRange } from '@/sections/home/ProductRange';
import { QuoteSection } from '@/sections/home/QuoteSection';
import { Services } from '@/sections/home/Services';
import { TheLine } from '@/sections/home/TheLine';

export const metadataFor = (locale: Locale) =>
  pageMetadata(locale, {
    title: 'Arifa Pack — Aluminium & food packaging made in Ajman, UAE',
    description:
      'Arifa Packing & Packaging LLC supplies aluminium containers, foil, platters, pots, microwave containers, cutlery and cling film from its facility in Al Jurf Industrial Area 2, Ajman, UAE.',
    path: '/',
    ogTitle: 'Arifa Pack — Packaging that protects, presents & performs',
    ogDescription: 'Aluminium containers, foil, platters, pots, microwave ware, cutlery and cling film from Al Jurf, Ajman.',
    ogImage: '/media/posters/hero-exterior.jpg',
  });

export const viewport: Viewport = { themeColor: '#050607' };

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name,
  alternateName: company.short,
  url: `${company.siteUrl}/`,
  logo: `${company.siteUrl}/images/brand/logo.png`,
  email: company.email,
  telephone: company.phones[0].label,
  address: { '@type': 'PostalAddress', streetAddress: 'Al Jurf Industrial Area 2', addressLocality: 'Ajman', addressCountry: 'AE' },
};

export function HomeView() {
  return (
    <PageShell page="home" overlays={<FilmPlayer />}>
      <JsonLd data={organization} />
      <Hero />
      <Intro />
      <TheLine />
      <ProductRange />
      <FactoryFloor />
      <Services />
      <QuoteSection />
    </PageShell>
  );
}
