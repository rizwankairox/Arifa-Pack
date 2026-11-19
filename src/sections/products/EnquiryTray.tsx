/*
  Enquiry tray
*/
import { t, lh } from '@/i18n';
export function EnquiryTray() {
  return (
    <aside className="tray" data-tray="" aria-label={t("Enquiry list")} hidden>
      <button className="tray__pill" type="button" data-tray-toggle="" aria-expanded="false">
        <span className="tray__stack" data-tray-stack="" aria-hidden="true"></span>
        <span className="tray__label">{t("Enquiry list")}</span>
        <span className="tray__count mono" data-tray-count="">
          0
        </span>
      </button>
      <div className="tray__panel" data-tray-panel="" data-lenis-prevent="">
        <div className="tray__head">
          <p className="mono">{t("Your enquiry list")}</p>
          <button className="link mono" type="button" data-tray-clear="">
            {t("Clear")}
          </button>
        </div>
        <ul className="tray__list" data-tray-list=""></ul>
        <a className="btn btn--leaf tray__cta" href={lh("/contact")} data-tray-cta="">
          <span className="btn__text" data-text={t("Request a quote")}>
            {t("Request a quote")}
          </span>
          <span className="btn__icon">
            <svg viewBox="0 0 24 24">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </span>
        </a>
        <p className="tray__note mono">{t("We'll carry this list into the quote form.")}</p>
      </div>
    </aside>
  );
}
