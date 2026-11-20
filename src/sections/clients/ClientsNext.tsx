/*
  03 · your business here
*/
import { t, lh } from '@/i18n';
export function ClientsNext() {
  return (
    <section className="cl-next" data-theme="dark">
      <div className="wrap cl-next__grid">
        <div>
          <p className="eyebrow">
            {t("Your business")}
          </p>
          <h2 className="cl-h2">
            {t("Not on the list?")}
            <br />
            <span className="is-dim">{t("Tell us what you pack.")}</span>
          </h2>
        </div>
        <div className="cl-next__links">
          <a className="btn btn--leaf" href={lh("/contact")} data-magnetic="">
            <span className="btn__text" data-text={t("Start your enquiry")}>
              {t("Start your enquiry")}
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
