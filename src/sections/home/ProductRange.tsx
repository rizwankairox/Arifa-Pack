/*
  03 · Product range
*/
import { t, lh } from '@/i18n';
import { getStats } from '@/data/catalogue';
import { CmsText } from '@/components/site/CmsText';

export function ProductRange() {
  return (
    <section className="range" id="range" data-theme="light" data-range="">
      <div className="wrap">
        <header className="range__head">
          <p className="eyebrow">
            <CmsText section="range" field="eyebrow">{t("Products")}</CmsText>
          </p>
          <h2 className="range__title" data-split-lines="">
            <CmsText section="range" field="heading">{t("Eight product families, catalogued by code and carton.")}</CmsText>
          </h2>
          <p className="range__sub">
            <CmsText section="range" field="body">
              {t("Each line opens the full listing with product codes and packing quantities.")}{' '}
              <a className="link" href={lh("/products")}>
                {t("See all {n} products", { n: getStats().products })}
              </a>
            </CmsText>
          </p>
        </header>

        <ul className="range__list" data-range-list="">
          <li className="range__item">
            <a href={lh("/products?family=containers")} data-cursor-text={t("View")}>
              <span className="range__n mono">01</span>
              <span className="range__name">{t("Aluminium Containers")}</span>
              <span className="range__desc">{t("Containers with lids — 19 references, 8325 to 831120.")}</span>
              <span className="range__tag mono">{t("Self range")}</span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/media/posters/line-stack.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=foil")} data-cursor-text={t("View")}>
              <span className="range__n mono">02</span>
              <span className="range__name">{t("Aluminium Foil")}</span>
              <span className="range__desc">{t("30 cm and 45 cm rolls, plain and Blue Line.")}</span>
              <span className="range__tag mono"></span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/media/posters/foil-roll.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=platters")} data-cursor-text={t("View")}>
              <span className="range__n mono">03</span>
              <span className="range__name">{t("Aluminium Platters")}</span>
              <span className="range__desc">{t("Serving platters — 6550, 6586, 65180 and 65220.")}</span>
              <span className="range__tag mono">{t("Self range")}</span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/images/catalogue/ap-6550.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=cups-trays")} data-cursor-text={t("View")}>
              <span className="range__n mono">04</span>
              <span className="range__name">{t("Cups & Trays")}</span>
              <span className="range__desc">{t("Aluminium cups and serving trays.")}</span>
              <span className="range__tag mono"></span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/media/posters/showroom-shelf.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=pots")} data-cursor-text={t("View")}>
              <span className="range__n mono">05</span>
              <span className="range__name">{t("Aluminium Pots")}</span>
              <span className="range__desc">{t("Pot & lid in five sizes, XS to XL (APLS-22 to APLS-39).")}</span>
              <span className="range__tag mono">{t("Self range")}</span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/images/catalogue/pot-22.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=microwave")} data-cursor-text={t("View")}>
              <span className="range__n mono">06</span>
              <span className="range__name">{t("Microwave Products")}</span>
              <span className="range__desc">{t("Plastic containers to heat, serve and store.")}</span>
              <span className="range__tag mono">{t("Self range")}</span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/media/posters/moulding-plastic.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=cutlery")} data-cursor-text={t("View")}>
              <span className="range__n mono">07</span>
              <span className="range__name">{t("Cutlery")}</span>
              <span className="range__desc">{t("Heavy-duty plastic knives, forks and spoons.")}</span>
              <span className="range__tag mono"></span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/media/posters/moulding-cutlery.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
          <li className="range__item">
            <a href={lh("/products?family=cling-film")} data-cursor-text={t("View")}>
              <span className="range__n mono">08</span>
              <span className="range__name">{t("Cling Film")}</span>
              <span className="range__desc">{t("Strong, flexible film that keeps food fresh.")}</span>
              <span className="range__tag mono"></span>
              <span className="range__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <img className="range__thumb" src="/images/products/clingfilm.webp" alt="" loading="lazy" decoding="async" width={64} height={64} />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
