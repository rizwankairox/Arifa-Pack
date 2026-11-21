/*
  05 · onward
*/
import { t, lh } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';
export function QualityNext() {
  return (
    <section className="q-next" id="see-it" data-theme="dark">
      <div className="wrap q-next__grid">
        <h2 className="q-h2"><CmsText section="see-it" field="heading">{t("See it for yourself.")}</CmsText></h2>
        <div className="q-next__links">
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
