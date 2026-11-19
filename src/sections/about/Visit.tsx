/*
  07 · visit
*/
import { t, lh } from '@/i18n';
import { company, phone } from '@/data/site';
export function Visit() {
  return (
    <section className="ab-visit" id="visit" data-theme="dark">
      <video
        className="ab-visit__film"
        muted
        loop
        playsInline
        preload="none"
        poster="/media/posters/hero-exterior.webp"
        data-src="/media/clips/hero-exterior.mp4"
        aria-hidden="true"
      ></video>
      <div className="ab-visit__shade" aria-hidden="true"></div>
      <div className="wrap ab-visit__inner">
        <p className="eyebrow">
          <span className="mono">(07)</span>{' '}{t("Visit")}
        </p>
        <h2 className="ab-visit__title">
          {t("Al Jurf Industrial Area 2,")}
          <br />
          {t("Ajman, UAE.")}
        </h2>
        <div className="ab-visit__grid">
          <div className="ab-glass ab-glass--info">
            <span className="ab-glass__tag mono">{t("Head office")}</span>
            <p>
              {t("Arifa Group")}
              <br />
              {t("Al Jurf Industrial Area 2, Ajman, UAE")}
            </p>
            <p className="mono">
              <a href={`tel:${phone.office.tel}`}>{phone.office.label}</a>
              <br />
              <a href={`mailto:${company.group.email}`}>{company.group.email}</a>
            </p>
          </div>
          <div className="ab-glass ab-glass--info">
            <span className="ab-glass__tag mono">{t("Packaging division")}</span>
            <p>
              {t("Arifa Packing & Packaging LLC")}
              <br />
              {t("Al Jurf Industrial Area 2, Ajman, UAE")}
            </p>
            <p className="mono">
              <a href={`tel:${phone.packaging.tel}`}>{phone.packaging.label}</a>
              <br />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
          </div>
          <div className="ab-glass ab-glass--info">
            <span className="ab-glass__tag mono">{t("Working hours")}</span>
            <p>
              {t("Monday – Saturday")}
              <br />
              {t("8:00am – 8:00pm")}
            </p>
            <p className="mono">{t("Sunday closed")}</p>
          </div>
        </div>
        <div className="ab-visit__cta">
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
          <a className="link mono" href={lh("/products")}>
            {t("Explore the range →")}
          </a>
        </div>
      </div>
    </section>
  );
}
