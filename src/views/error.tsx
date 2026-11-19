'use client';
/*
  "Something went wrong": shown in place of a page if it crashes while loading, in English or
  Arabic. Routes: src/app/(en)/error.tsx and src/app/(ar)/ar/error.tsx. (Unknown addresses get
  the 404 page instead: src/views/notfound.tsx.)

  It runs in the browser, so its words are written here for both languages rather than looked up.
*/
import { useEffect } from 'react';
import { LogoMark } from '@/components/site/LogoMark';
import '@/styles/notfound.css';

const TEXT = {
  en: {
    eyebrow: 'Something went wrong',
    title: 'This page stopped on the line.',
    lede: 'Something went wrong while loading this page. Try again, or carry on from the home page or the full range.',
    retry: 'Try again',
    home: 'Back to home',
    products: 'Browse all products',
    logo: 'Arifa Pack — home',
  },
  ar: {
    eyebrow: 'حدث خطأ ما',
    title: 'توقفت هذه الصفحة على خط الإنتاج.',
    lede: 'حدث خطأ أثناء تحميل هذه الصفحة. حاول مرة أخرى، أو تابع من الصفحة الرئيسية أو من جميع المنتجات.',
    retry: 'حاول مرة أخرى',
    home: 'العودة إلى الرئيسية',
    products: 'تصفّح جميع المنتجات',
    logo: 'عارفة باك — الصفحة الرئيسية',
  },
};

export function ErrorView({ locale, error, reset }: { locale: 'en' | 'ar'; error: Error & { digest?: string }; reset: () => void }) {
  const tx = TEXT[locale];
  const base = locale === 'ar' ? '/ar' : '';

  useEffect(() => {
    console.error(error);
    // the page's own scripts never started, so lift the loading state and use the dark ground
    document.body.classList.remove('is-loading');
    document.body.classList.add('page-notfound');
    document.querySelector('[data-loader]')?.remove();
  }, [error]);

  return (
    <main id="main">
      <section className="nf" data-theme="dark" aria-labelledby="err-title">
        <div className="wrap nf__inner">
          <a className="nf__logo" href={base || '/'} aria-label={tx.logo}>
            <LogoMark />
          </a>
          <p className="eyebrow">
            <span className="mono">(!)</span> {tx.eyebrow}
          </p>
          <h1 className="nf__title" id="err-title">
            {tx.title}
          </h1>
          <p className="nf__lede">{tx.lede}</p>
          <div className="nf__actions">
            <button className="btn btn--leaf" type="button" onClick={reset}>
              <span className="btn__text" data-text={tx.retry}>
                {tx.retry}
              </span>
            </button>
            <a className="btn btn--line" href={base || '/'}>
              <span className="btn__text" data-text={tx.home}>
                {tx.home}
              </span>
            </a>
            <a className="btn btn--line" href={`${base}/products`}>
              <span className="btn__text" data-text={tx.products}>
                {tx.products}
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
