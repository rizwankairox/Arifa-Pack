/*
  Catalogue
*/
import { CategoryChips } from './CategoryChips';
import { ProductGrid } from './ProductGrid';
import { getStats } from '@/data/catalogue';
import { pad2 } from '@/lib/format';
import { t, lh } from '@/i18n';

export function Catalogue() {
  const stats = getStats();
  return (
    <section className="cat" id="catalogue" data-theme="light" aria-label={t("Product catalogue")}>
      <div className="cat-bar" data-cat-bar="">
        <div className="wrap cat-bar__inner">
          <label className="cat-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 21 21" />
            </svg>
            <input
              type="search"
              placeholder={t("Search a code or name — try 83185")}
              autoComplete="off"
              spellCheck="false"
              data-cat-search=""
              aria-label={t("Search products by code or name")}
            />
            <kbd className="mono" aria-hidden="true">
              /
            </kbd>
          </label>
          <div className="cat-chips" role="toolbar" aria-label={t("Filter by family")} data-cat-chips="">
            <span className="cat-chips__pill" data-chip-pill="" aria-hidden="true"></span>
            <CategoryChips />
          </div>
          <div className="cat-bar__end">
            {/* the Arifa self range: its own collection, as on the old site (catalogueClient.ts) */}
            <button className="cat-switch" type="button" data-cat-self="" aria-pressed="false">
              <i aria-hidden="true"></i>{t("Self range")}
            </button>
            <div className="cat-view" role="group" aria-label={t("Layout")}>
              <button type="button" data-view="grid" aria-pressed="true" aria-label={t("Grid view")}>
                <svg viewBox="0 0 24 24">
                  <rect x="4" y="4" width={7} height={7} />
                  <rect x="13" y="4" width={7} height={7} />
                  <rect x="4" y="13" width={7} height={7} />
                  <rect x="13" y="13" width={7} height={7} />
                </svg>
              </button>
              <button type="button" data-view="index" aria-pressed="false" aria-label={t("Index view")}>
                <svg viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="wrap cat-bar__status mono" aria-live="polite">
          <span>
            <b data-cat-count="">{pad2(stats.products)}</b> <span data-cat-noun="">{t("products")}</span>
            <span data-cat-scope=""></span>
          </span>
          <button className="cat-reset" type="button" data-cat-reset="" hidden>
            {t("Clear filters ×")}
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="cat-grid" data-cat-grid="" data-view="grid">
          <ProductGrid />
        </div>
        <div className="cat-empty" data-cat-empty="" hidden>
          <p className="cat-empty__big">
            {t("No match for “")}<span data-cat-empty-q=""></span>”.
          </p>
          <p>
            {t("We list what's published today — the factory may still make it.")}{' '}
            <a className="link" href={lh("/contact")}>
              {t("Ask the packaging team")}
            </a>{' '}
            {t("or")}{' '}
            <button className="link" type="button" data-cat-reset="">
              {t("clear the search")}
            </button>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
