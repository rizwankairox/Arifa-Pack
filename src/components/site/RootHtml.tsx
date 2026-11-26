/*
  The outer HTML shared by every page: fonts (self-hosted, src/styles/fonts.css), the base stylesheet, and the <body> the pages
  sit in — in English (src/app/(en)/layout.tsx) or Arabic, right to left (src/app/(ar)/layout.tsx).
  Each page adds its own frame with <PageShell> (src/components/site/PageShell.tsx).
*/
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/locale';
import '@/styles/fonts.css';
// the site-wide styles, in this order (src/styles/site/)
import '@/styles/site/base.css';
import '@/styles/site/chrome.css';
import '@/styles/site/sections.css';
import '@/styles/site/footer.css';
import '@/styles/site/responsive.css';
import '@/styles/site/assistant.css';
import '@/styles/rtl.css';
import '@/styles/site/phone-text.css';

// the fonts every page needs first, fetched straight away (the rest load as their letters appear: src/styles/fonts.css)
const PRELOAD = {
  en: ['/fonts/archivo-latin-wdth-normal.woff2'],
  ar: ['/fonts/archivo-latin-wdth-normal.woff2', '/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2'],
};

export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    // "no-js" becomes "js" before the first paint, so the page can hide what its scripts will animate in.
    // (suppressHydrationWarning: these two tags are changed by those tiny scripts on purpose)
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="no-js" suppressHydrationWarning>
      {/* (the root layouts in src/app/(en) and src/app/(ar) render this, so a plain <head> is right here) */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {PRELOAD[locale].map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
        ))}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.replace('no-js','js')" }} />
        {/* the logo intro plays once per visit (tab): after that, pages open straight away, with no curtain flash (src/motion/loader.ts) */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('arifa-intro')==='1')document.documentElement.classList.add('no-intro')}catch(e){}" }} />
      </head>
      <body className="is-loading" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
