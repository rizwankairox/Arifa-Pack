// Which language the page being rendered is in. Set once by each page (src/app/(ar)/ar/… sets 'ar');
// every component below it reads it through t() and lh() (src/i18n/index.ts).
import { cache } from 'react';

export type Locale = 'en' | 'ar';
export const LOCALES: Locale[] = ['en', 'ar'];

const store = cache(() => ({ locale: 'en' as Locale }));

export function setLocale(locale: Locale) {
  store().locale = locale;
}

export function getLocale(): Locale {
  return store().locale;
}
