// Page titles, descriptions and share previews, in the same shape for every page — in English
// or Arabic, each pointing search engines at the other language (hreflang).
import type { Metadata } from 'next';
import { ar } from '@/i18n/ar';
import type { Locale } from '@/i18n/locale';
import { english, localHref, lookup, type Vars } from '@/i18n/translate';

type PageMeta = {
  title: string;
  description: string;
  /** the page's address on the site, e.g. "/about" (the English one; /ar is added for Arabic) */
  path: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  /** numbers to fill into {n}-style gaps in the text */
  vars?: Vars;
};

export function pageMetadata(locale: Locale, m: PageMeta): Metadata {
  const tr = (s: string) => (locale === 'ar' ? lookup(ar, s, m.vars) : english(s, m.vars));
  const path = localHref(m.path, locale === 'ar');
  const arPath = localHref(m.path, true);
  return {
    title: tr(m.title),
    description: tr(m.description),
    alternates: { canonical: path, languages: { en: m.path, ar: arPath, 'x-default': m.path } },
    openGraph: {
      type: 'website',
      title: tr(m.ogTitle),
      description: tr(m.ogDescription),
      images: [m.ogImage],
      url: path,
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      alternateLocale: locale === 'ar' ? 'en_AE' : 'ar_AE',
    },
  };
}
