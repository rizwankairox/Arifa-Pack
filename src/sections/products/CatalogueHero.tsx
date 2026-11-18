/*
  Hero: the catalogue, and its families
*/
import { FamilyBand } from './FamilyBand';
import { getStats } from '@/data/catalogue';
import { pad2 } from '@/lib/format';
import { t } from '@/i18n';

export function CatalogueHero() {
  const stats = getStats();
  return (
    <section className="cat-hero" id="top" data-theme="light" data-cat-hero="">
      <div className="wrap cat-hero__head">
        <p className="eyebrow cat-hero__eyebrow">
          <span className="mono">{t("(P)")}</span>{' '}{t("Products — the catalogue")}
        </p>
        <h1 className="cat-hero__title" data-hero-title="">
          <span className="cat-hero__row">{t("Every code,")}</span>
          <span className="cat-hero__row">
            {t("every")}{' '}<em>{t("carton")}</em>.
          </span>
        </h1>
        <div className="cat-hero__meta">
          <p className="cat-hero__lede">
            {t("The full Arifa Pack range, from the 8325 container to 30 cm cling film. Search by product code, filter by family, and build an enquiry list as you go.")}
          </p>
          <dl className="cat-stats">
            <div>
              <dt className="mono">{t("Products")}</dt>
              <dd data-count-to={pad2(stats.products)}>{pad2(stats.products)}</dd>
            </div>
            <div>
              <dt className="mono">{t("Families")}</dt>
              <dd data-count-to={pad2(stats.families)}>{pad2(stats.families)}</dd>
            </div>
            <div>
              <dt className="mono">{t("Self range")}</dt>
              <dd data-count-to={pad2(stats.self)}>{pad2(stats.self)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* the families as quiet tiles: a tile filters the catalogue below and glides down to it (src/sections/products/families.ts) */}
      <nav className="fams" aria-label={t("Browse by family")} data-fams="">
        <div className="wrap">
          <div className="fams__head">
            <p className="fams__label mono">{t("Browse by family")}</p>
            <a className="fams__all mono" href="#catalogue" data-fams-all="">
              {t("All")}{' '}{pad2(stats.products)}{' '}{t("products")}{' '}<span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className="fams__grid">
            <FamilyBand />
          </ul>
        </div>
      </nav>
    </section>
  );
}
