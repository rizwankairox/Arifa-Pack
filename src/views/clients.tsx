// Clients & Industries — a day of deliveries, the pallet of clients, and customer stories.  Routes: src/app/(en)/… and src/app/(ar)/ar/…
// Content: src/data/clients.json (sample content, clearly tagged, until Arifa approves the real details).
import type { Viewport } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { pageMetadata } from '@/lib/seo';
import { t, type Locale } from '@/i18n';
import { ClientPallet } from '@/sections/clients/ClientPallet';
import { ClientsNext } from '@/sections/clients/ClientsNext';
import { CustomerStories } from '@/sections/clients/CustomerStories';
import { DeliveryRoute } from '@/sections/clients/DeliveryRoute';
import '@/styles/clients.css';

export const metadataFor = (locale: Locale) =>
  pageMetadata(locale, {
    title: 'Clients, Industries & Customer Stories | Arifa Pack',
    description:
      'Explore the industries Arifa Pack packs for, from restaurants and bakeries to catering teams, with customer story previews and packaging selections.',
    path: '/clients',
    ogTitle: 'Clients, Industries & Customer Stories · Arifa Pack',
    ogDescription: 'Explore the industries Arifa Pack packs for, customer story previews and packaging selections.',
    ogImage: '/images/og/clients.jpg',
  });

export const viewport: Viewport = { themeColor: '#08090b' };

export function ClientsView() {
  return (
    <PageShell page="clients" skip={{ href: '#industries', label: t('Skip to the industries') }}>
      <DeliveryRoute />
      <ClientPallet />
      <CustomerStories />
      <ClientsNext />
    </PageShell>
  );
}
