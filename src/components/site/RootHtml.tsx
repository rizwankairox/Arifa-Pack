/*
  The outer HTML shared by every page: fonts, the base stylesheet, and the <body> the pages
  sit in — in English (src/app/(en)/layout.tsx) or Arabic, right to left (src/app/(ar)/layout.tsx).
  Each page adds its own frame with <PageShell> (src/components/site/PageShell.tsx).
*/
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/locale';
import '@/styles/main.css';
import '@/styles/rtl.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap';

export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    // "no-js" becomes "js" before the first paint, so the page can hide what its scripts will animate in.
    // (suppressHydrationWarning: these two tags are changed by those tiny scripts on purpose)
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="no-js" suppressHydrationWarning>
      {/* (the root layouts in src/app/(en) and src/app/(ar) render this, so a plain <head> is right here) */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={FONTS} rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.replace('no-js','js')" }} />
      </head>
      <body className="is-loading" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
