/*
  01 · a person, or the assistant
*/
import { t } from '@/i18n';
export function TalkToUs() {
  return (
    <section className="ct-people" id="call" data-theme="light">
      <div className="wrap">
        <div className="ct-people__head">
          <p className="eyebrow">
            <span className="mono">(01)</span>{' '}{t("Rather talk?")}
          </p>
          <h2 className="ct-h2">
            {t("A person in Ajman,")}
            <br />
            <span className="is-dim">{t("or Arifa, right here.")}</span>
          </h2>
        </div>
        <div className="ct-people__grid">
          <article className="ct-hours" data-hours="">
            <svg className="ct-hours__dial" viewBox="0 0 220 220" data-dial="" aria-hidden="true" />
            <div className="ct-hours__text">
              <p className="ct-hours__state" data-hours-state="">
                {t("Ajman time")}
              </p>
              <p className="mono" data-hours-time="">
                {t("— GST")}
              </p>
              <p className="ct-hours__plain">
                {t("Monday – Saturday, 08:00 – 20:00")}
                <br />
                {t("Sunday closed")}
              </p>
            </div>
          </article>

          <article className="ct-line-card">
            <p className="ct-line-card__tag mono">
              <i></i>{t("Packaging division · orders & quotes")}
            </p>
            <a className="ct-line-card__num" href="tel:+97167485384">
              +971 6 748 5384
            </a>
            <div className="ct-line-card__actions">
              <a className="btn btn--line" href="tel:+97167485384">
                <span className="btn__text" data-text={t("Call")}>
                  {t("Call")}
                </span>
              </a>
              <button type="button" className="ct-copy mono" data-copy="+971 6 748 5384">
                {t("Copy number")}
              </button>
            </div>
            <div className="ct-line-card__mail">
              <span className="mono">{t("info@arifapack.com")}</span>
              <button type="button" className="ct-copy mono" data-copy="info@arifapack.com">
                {t("Copy email")}
              </button>
            </div>
            <p className="ct-line-card__who">{t("Arifa Packing & Packaging LLC")}</p>
          </article>

          <article className="ct-line-card">
            <p className="ct-line-card__tag mono">
              <i></i>{t("Head office · Arifa Group")}
            </p>
            <a className="ct-line-card__num" href="tel:+97167477061">
              +971 6 747 7061
            </a>
            <div className="ct-line-card__actions">
              <a className="btn btn--line" href="tel:+97167477061">
                <span className="btn__text" data-text={t("Call")}>
                  {t("Call")}
                </span>
              </a>
              <button type="button" className="ct-copy mono" data-copy="+971 6 747 7061">
                {t("Copy number")}
              </button>
            </div>
            <div className="ct-line-card__mail">
              <span className="mono">{t("info@arifagroup.com")}</span>
              <button type="button" className="ct-copy mono" data-copy="info@arifagroup.com">
                {t("Copy email")}
              </button>
            </div>
            <p className="ct-line-card__who">{t("Arifa Group")}</p>
          </article>

          <article className="ct-talk">
            <span className="ct-talk__leaf" aria-hidden="true">
              <img src="/images/brand/leaf.png" alt="" width={64} height={64} />
            </span>
            <h3>{t("Talk to Arifa")}</h3>
            <p>{t("Say what you need, out loud or typed, and the Arifa assistant starts the enquiry for you.")}</p>
            <button type="button" className="btn btn--leaf" data-talk="">
              <span className="btn__text" data-text={t("Start talking")}>
                {t("Start talking")}
              </span>
              <span className="btn__icon">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
