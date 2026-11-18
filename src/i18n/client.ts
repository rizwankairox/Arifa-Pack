/*
  Translating text written by the browser-side scripts (counters, buttons that change label,
  the assistant…). The page's language is read from <html lang>, set by the server.
*/
import { arClient } from './ar-client';
import { english, localHref, lookup, type Vars } from './translate';

export const isArPage = () => typeof document !== 'undefined' && document.documentElement.lang === 'ar';

export function tc(s: string, vars?: Vars): string {
  return isArPage() ? lookup(arClient, s, vars) : english(s, vars);
}

export const lhc = (href: string) => localHref(href, isArPage());

/** BCP-47 language for speech and number formatting */
export const pageLang = () => (isArPage() ? 'ar-AE' : 'en-GB');
