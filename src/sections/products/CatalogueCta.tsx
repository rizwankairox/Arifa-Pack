/*
  CTA
*/
import { t, lh } from '@/i18n';
import { phone } from '@/data/site';
export function CatalogueCta() {
  return (
    <section className="cat-cta" data-theme="dark">
      <div className="wrap cat-cta__inner">
        <p className="eyebrow">
          {t("Not listed")}
        </p>
        <h2 className="cat-cta__title" data-split-lines="">
          {t("Need a size or code that isn't here?")}
        </h2>
        <div className="cat-cta__actions">
          <p>{t("Tell the packaging team the shape, capacity and quantity you need. Custom packaging design and branding are also available.")}</p>
          <a className="btn btn--leaf" href={lh("/contact")} data-magnetic="">
            <span className="btn__text" data-text={t("Request a quote")}>
              {t("Request a quote")}
            </span>
            <span className="btn__icon">
              <svg viewBox="0 0 24 24">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </span>
          </a>
          <a className="link mono" href={`tel:${phone.packaging.tel}`}>
            {t("Packaging division · {phone}", { phone: phone.packaging.label })}
          </a>
        </div>
      </div>
    </section>
  );
}
