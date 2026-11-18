// About — the company.  Routes: src/app/(en)/… and src/app/(ar)/ar/…
import type { Viewport } from 'next';
import { JsonLd } from '@/components/site/JsonLd';
import { PageShell } from '@/components/site/PageShell';
import { company } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import { t, type Locale } from '@/i18n';
import { AboutStage } from '@/sections/about/AboutStage';
import { Chairman } from '@/sections/about/Chairman';
import { Leadership } from '@/sections/about/Leadership';
import { Reach } from '@/sections/about/Reach';
import { Visit } from '@/sections/about/Visit';
import { WhatWeDo } from '@/sections/about/WhatWeDo';
import '@/styles/about.css';

export const metadataFor = (locale: Locale) =>
  pageMetadata(locale, {
    title: 'About Arifa Pack — packaging that protects, presents and performs | Arifa Pack',
    description:
      'Arifa Packing & Packaging LLC makes disposable packaging — aluminium containers, plastic containers and disposable cutlery — in Al Jurf Industrial Area 2, Ajman, UAE. The packaging division of Arifa Group, established in 1997.',
    path: '/about',
    ogTitle: 'About Arifa Pack',
    ogDescription: 'Disposable packaging made in Ajman, UAE: aluminium containers, plastic containers and disposable cutlery.',
    ogImage: '/media/posters/hero-exterior.jpg',
  });

export const viewport: Viewport = { themeColor: '#080706' };

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name,
  alternateName: company.short,
  url: `${company.siteUrl}/`,
  logo: `${company.siteUrl}/images/brand/logo-light.png`,
  email: company.email,
  telephone: company.phones[1].label,
  address: { '@type': 'PostalAddress', streetAddress: 'Al Jurf Industrial Area 2', addressLocality: 'Ajman', addressCountry: 'AE' },
  parentOrganization: { '@type': 'Organization', name: 'Arifa Group', email: 'info@arifagroup.com', telephone: company.phones[0].label },
  openingHours: 'Mo-Sa 08:00-20:00',
};

export function AboutView() {
  return (
    <PageShell page="about" skip={{ href: '#story', label: t('Skip to the story') }}>
      <JsonLd data={organization} />
      <AboutStage />
      <Reach />
      <Chairman />
      <Leadership />
      <WhatWeDo />
      <Visit />
    </PageShell>
  );
}
