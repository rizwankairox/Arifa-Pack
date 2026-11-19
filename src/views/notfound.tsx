// "Page not found" (404), in English and Arabic. Shown for any address the site doesn't have,
// e.g. /no-such-page, /ar/no-such-page or /products/unknown-code.
// Routes: src/app/(en)/not-found.tsx and src/app/(ar)/ar/not-found.tsx (with the [...missing] catch-alls beside them).
import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { getFamilyInfo } from '@/data/catalogue';
import { lh, t, type Locale } from '@/i18n';
import { ar } from '@/i18n/ar';
import { english, lookup } from '@/i18n/translate';
import '@/styles/notfound.css';

export const metadataFor = (locale: Locale): Metadata => {
  const tr = (s: string) => (locale === 'ar' ? lookup(ar, s) : english(s));
  return {
    title: tr('Page not found | Arifa Pack'),
    description: tr('This page is not on the Arifa Pack site. Go to the home page, browse the range or request a quote.'),
    robots: { index: false },
  };
};

const arrow = (
  <span className="btn__icon">
    <svg viewBox="0 0 24 24">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  </span>
);

export function NotFoundView() {
  const families = getFamilyInfo();
  return (
    <PageShell page="notfound">
      <section className="nf" data-theme="dark" aria-labelledby="nf-title">
        <div className="wrap nf__inner">
          <p className="eyebrow">
            <span className="mono">(404)</span> {t('Page not found')}
          </p>
          <h1 className="nf__title" id="nf-title">
            {t('This page is not on the line.')}
          </h1>
          <p className="nf__lede">
            {t('The address may be mistyped or out of date, or the page may have moved. Everything Arifa makes is still one click away.')}
          </p>
          <div className="nf__actions">
            <a className="btn btn--leaf" href={lh('/')} data-magnetic="">
              <span className="btn__text" data-text={t('Back to home')}>
                {t('Back to home')}
              </span>
              {arrow}
            </a>
            <a className="btn btn--line" href={lh('/products')} data-magnetic="">
              <span className="btn__text" data-text={t('Browse all products')}>
                {t('Browse all products')}
              </span>
            </a>
            <a className="btn btn--line" href={lh('/contact')} data-magnetic="">
              <span className="btn__text" data-text={t('Request a quote')}>
                {t('Request a quote')}
              </span>
            </a>
          </div>
          <nav className="nf__families" aria-label={t('Product families')}>
            <p className="nf__label mono">{t('Or go straight to a family')}</p>
            <ul>
              {families.map((f) => (
                <li key={f.id}>
                  <a href={lh(`/products?family=${f.id}`)} data-hover-line="">
                    <span>{f.name}</span>
                    <span className="mono">{f.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </PageShell>
  );
}
