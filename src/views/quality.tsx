// Quality & Sustainability — shown, not claimed.  Routes: src/app/(en)/… and src/app/(ar)/ar/…
import type { Viewport } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { pageMetadata } from '@/lib/seo';
import { t, type Locale } from '@/i18n';
import { CheckedLine } from '@/sections/quality/CheckedLine';
import { Documents } from '@/sections/quality/Documents';
import { Hygiene } from '@/sections/quality/Hygiene';
import { QualityHero } from '@/sections/quality/QualityHero';
import { QualityNext } from '@/sections/quality/QualityNext';
import { Sustainability } from '@/sections/quality/Sustainability';
import '@/styles/quality.css';

export const metadataFor = (locale: Locale) =>
  pageMetadata(locale, {
    title: 'Quality & Sustainability — checked from coil to carton | Arifa Pack',
    description:
      'How Arifa Packing & Packaging LLC checks its packaging from aluminium coil to sealed carton, the hygiene you can see on the factory floor in Al Jurf, Ajman, and what the range is made of.',
    path: '/quality',
    ogTitle: 'Quality & Sustainability · Arifa Pack',
    ogDescription: 'Checked from coil to carton, in Al Jurf, Ajman.',
    ogImage: '/media/posters/inspect.jpg',
  });

export const viewport: Viewport = { themeColor: '#08090b' };

export function QualityView() {
  return (
    <PageShell page="quality" skip={{ href: '#line', label: t('Skip to the quality line') }}>
      {/* Every statement on this page is shown with its evidence: our own factory footage, a count from the catalogue, or a document. */}
      <QualityHero />
      <CheckedLine />
      <Hygiene />
      <Documents />
      <Sustainability />
      <QualityNext />
    </PageShell>
  );
}
