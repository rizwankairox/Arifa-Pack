/*
  02 · where we are: the UAE in line, with Ajman lit
*/
import { t } from '@/i18n';
import { company } from '@/data/site';
export function WhereWeAre() {
  return (
    <section className="ct-where" id="where" data-theme="dark">
      <div className="wrap ct-where__grid">
        {/* the map itself is the way to directions: click or tap it to open the location in Maps */}
        <a
          className="ct-where__map"
          href={company.maps}
          target="_blank"
          rel="noopener"
          aria-label={t("Open Arifa Packing & Packaging LLC, Al Jurf Industrial Area 2, Ajman, in Maps (opens in a new tab)")}
        >
          <svg viewBox="0 0 1000 760" data-where-map="" aria-hidden="true" focusable="false" />
          <span className="ct-where__open mono" aria-hidden="true">
            {t("Open in Maps ↗")}
          </span>
        </a>
        <div className="ct-where__text">
          <p className="eyebrow">
            {t("Where we are")}
          </p>
          <h2 className="ct-h2">
            {t("Al Jurf,")}
            <br />
            <span className="is-dim">{t("Ajman, UAE.")}</span>
          </h2>
          <dl className="ct-where__facts">
            <div>
              <dt className="mono">{t("Address")}</dt>
              <dd>
                {t("Arifa Packing & Packaging LLC")}
                <br />
                {t("Al Jurf Industrial Area 2, Ajman")}
                <br />
                {t("United Arab Emirates")}
              </dd>
            </div>
            <div>
              <dt className="mono">{t("Head office & packaging division")}</dt>
              <dd>{t("Both at Al Jurf Industrial Area 2")}</dd>
            </div>
            <div>
              <dt className="mono">{t("Local time")}</dt>
              <dd data-local-time="">{t("— GST (UTC+4)")}</dd>
            </div>
            <div>
              <dt className="mono">{t("Visiting")}</dt>
              <dd>{t(company.hoursLong)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn--line"
            data-copy="Arifa Packing & Packaging LLC, Al Jurf Industrial Area 2, Ajman, United Arab Emirates"
          >
            <span className="btn__text" data-text={t("Copy the address")}>
              {t("Copy the address")}
            </span>
          </button>
          <p className="ct-where__copied mono" data-copied="" role="status" aria-live="polite"></p>
        </div>
      </div>
    </section>
  );
}
