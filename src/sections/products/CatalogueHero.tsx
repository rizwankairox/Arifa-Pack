/*
  The top of the Products page: straight into the eight families (the tiles), then the catalogue below.
*/
import { FamilyBand } from './FamilyBand';
import { getStats } from '@/data/catalogue';
import { pad2 } from '@/lib/format';
import { t } from '@/i18n';

export function CatalogueHero() {
  const stats = getStats();
  return (
    <section className="cat-hero" id="top" data-theme="light" data-cat-hero="">
      {/* the page's heading, for search engines and screen readers: the family tiles are the first thing people see */}
      <h1 className="sr-only">{t("Arifa Pack products: every code, every carton")}</h1>

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
