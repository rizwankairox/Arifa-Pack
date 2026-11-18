/*
  Quick view
*/
import { t } from '@/i18n';
export function QuickView() {
  return (
    <div className="qv" data-qv="" role="dialog" aria-modal="true" aria-labelledby="qv-title" aria-hidden="true">
      <div className="qv__backdrop" data-qv-close=""></div>
      <div className="qv__panel" data-qv-panel="">
        <div className="qv__stage" data-qv-stage="">
          <img className="qv__img" data-qv-img="" alt="" />
          <div className="qv__pending" data-qv-pending="" hidden>
            <span data-qv-pending-ref=""></span>
            <small className="mono">{t("Photo to follow")}</small>
          </div>
        </div>
        <div className="qv__info">
          <div className="qv__top">
            <p className="mono qv__family" data-qv-family=""></p>
            <div className="qv__nav">
              <button type="button" className="qv__arrow" data-qv-prev="" aria-label={t("Previous product")}>
                <svg viewBox="0 0 24 24">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="mono" data-qv-pos=""></span>
              <button type="button" className="qv__arrow" data-qv-next="" aria-label={t("Next product")}>
                <svg viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button type="button" className="qv__close mono" data-qv-close="">
                {t("Close ✕")}
              </button>
            </div>
          </div>
          <div className="qv__headline">
            <p className="qv__ref" data-qv-ref=""></p>
            <h2 className="qv__title" id="qv-title" data-qv-title=""></h2>
            <span className="qv__tag mono" data-qv-tag="" hidden>
              {t("Arifa self range")}
            </span>
          </div>
          <dl className="qv__spec" data-qv-spec=""></dl>
          <div className="qv__actions">
            <button className="btn btn--ink" type="button" data-qv-enquire="">
              <span className="btn__text" data-text={t("Add to enquiry list")}>
                {t("Add to enquiry list")}
              </span>
            </button>
            <a className="link mono" data-qv-live="" target="_blank" rel="noopener">
              {t("Current listing on arifapack.com ↗")}
            </a>
          </div>
          <p className="qv__note mono">{t("Specifications and lead times are confirmed by the packaging team with your quote.")}</p>
        </div>
      </div>
    </div>
  );
}
