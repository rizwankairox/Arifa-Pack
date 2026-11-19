// Contact — the enquiry desk, a person or the assistant, and where we are.  Routes: src/app/(en)/… and src/app/(ar)/ar/…
// (?trade=…&families=… pre-fills the desk; the Clients page links here that way)
import type { Viewport } from 'next';
import { JsonLd } from '@/components/site/JsonLd';
import { PageShell } from '@/components/site/PageShell';
import { company } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import { t, type Locale } from '@/i18n';
import { EnquiryDesk } from '@/sections/contact/EnquiryDesk';
import { TalkToUs } from '@/sections/contact/TalkToUs';
import { WhereWeAre } from '@/sections/contact/WhereWeAre';
import '@/styles/contact.css';

export const metadataFor = (locale: Locale) =>
  pageMetadata(locale, {
    title: 'Contact Arifa Pack — request a quote, call or visit us in Ajman | Arifa Pack',
    description:
      'Request a quote from Arifa Packing & Packaging LLC in six quick answers, call the packaging division on {phone}, or write to {email}. Al Jurf Industrial Area 2, Ajman, UAE.',
      vars: { phone: company.phones[1].label, email: company.email },
    path: '/contact',
    ogTitle: 'Contact Arifa Pack',
    ogDescription: 'Request a quote, call the packaging team, or visit us in Al Jurf Industrial Area 2, Ajman, UAE.',
    ogImage: '/images/og/contact.jpg',
  });

export const viewport: Viewport = { themeColor: '#08090b' };

const contactPage = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Arifa Pack',
  url: `${company.siteUrl}/contact`,
  mainEntity: {
    '@type': 'Organization',
    name: company.name,
    alternateName: company.short,
    url: `${company.siteUrl}/`,
    email: company.email,
    telephone: company.phones[1].label,
    address: { '@type': 'PostalAddress', ...company.postal },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: company.phones[1].label,
        email: company.email,
        areaServed: 'AE',
        availableLanguage: ['English', 'Arabic'],
      },
      { '@type': 'ContactPoint', contactType: 'customer service', telephone: company.phones[0].label, email: company.group.email },
    ],
    parentOrganization: { '@type': 'Organization', name: company.group.name, email: company.group.email, telephone: company.phones[0].label },
    openingHours: company.hoursSchema,
  },
};

export function ContactView() {
  return (
    <PageShell page="contact" skip={{ href: '#enquiry', label: t('Skip to the enquiry') }} withCatalogue>
      <JsonLd data={contactPage} />
      <EnquiryDesk />
      <TalkToUs />
      <WhereWeAre />
    </PageShell>
  );
}
