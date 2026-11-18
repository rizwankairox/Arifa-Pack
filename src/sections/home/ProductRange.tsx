/*
  03 · Product range
*/
import { SceneCanvas } from '@/three/SceneCanvas';
import { t, lh } from '@/i18n';

export function ProductRange() {
  return (
    <section className="range" id="range" data-theme="light" data-range="">
      <div className="wrap">
        <header className="range__head">
          <p className="eyebrow">
            <span className="mono">(03)</span>{' '}{t("Products")}
          </p>
          <h2 className="range__title" data-split-lines="">
            {t("Eight product families, catalogued by code and carton.")}
          </h2>
          <p className="range__sub">
            {t("Each line opens the full listing with product codes and packing quantities.")}{' '}
            <a className="link" href={lh("/products")}>
              {t("See all 78 products")}
            </a>
          </p>
        </header>

        <ul className="range__list" data-range-list="">
          <li className="range__item" data-media="/media/clips/line-stack.mp4" data-kind="video">
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
              <img className="range__thumb" src="/media/posters/line-stack.jpg" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/media/clips/foil-roll.mp4" data-kind="video">
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
              <img className="range__thumb" src="/media/posters/foil-roll.jpg" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/images/products/sr-6550.png" data-kind="image">
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
              <img className="range__thumb" src="/images/products/sr-6550.png" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/media/clips/showroom-shelf.mp4" data-kind="video">
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
              <img className="range__thumb" src="/media/posters/showroom-shelf.jpg" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/images/products/sr-pot22.png" data-kind="image">
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
              <img className="range__thumb" src="/images/products/sr-pot22.png" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/media/clips/moulding-plastic.mp4" data-kind="video">
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
              <img className="range__thumb" src="/media/posters/moulding-plastic.jpg" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/media/clips/moulding-cutlery.mp4" data-kind="video">
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
              <img className="range__thumb" src="/media/posters/moulding-cutlery.jpg" alt="" loading="lazy" />
            </a>
          </li>
          <li className="range__item" data-media="/images/products/clingfilm.png" data-kind="image">
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
              <img className="range__thumb" src="/images/products/clingfilm.png" alt="" loading="lazy" />
            </a>
          </li>
        </ul>
      </div>
      <SceneCanvas name="range" className="range__gl" dataAttr="data-range-gl" />
    </section>
  );
}
