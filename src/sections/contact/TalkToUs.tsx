/*
  01 · a person, or the assistant
*/
import { t } from '@/i18n';
import { company, phone } from '@/data/site';
import { CmsText } from '@/components/site/CmsText';
export function TalkToUs() {
  return (
    <section className="ct-people" id="call" data-theme="light">
      <div className="wrap">
        <div className="ct-people__head">
          <p className="eyebrow">
            <CmsText section="call" field="eyebrow">{t("Rather talk?")}</CmsText>
          </p>
          <h2 className="ct-h2">
            <CmsText section="call" field="heading">
              {t("A person in Ajman,")}
              <br />
              <span className="is-dim">{t("or Arifa, right here.")}</span>
            </CmsText>
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
                {t(company.hoursLong)}
                <br />
                {t("Sunday closed")}
              </p>
            </div>
          </article>

          <article className="ct-line-card">
            <p className="ct-line-card__tag mono">
              <i></i>{t("Packaging division · orders & quotes")}
            </p>
            <a className="ct-line-card__num" href={`tel:${phone.packaging.tel}`}>
              {phone.packaging.label}
            </a>
            <div className="ct-line-card__actions">
              <a className="btn btn--line" href={`tel:${phone.packaging.tel}`}>
                <span className="btn__text" data-text={t("Call")}>
                  {t("Call")}
                </span>
              </a>
              <button type="button" className="ct-copy mono" data-copy={phone.packaging.label}>
                {t("Copy number")}
              </button>
            </div>
            <div className="ct-line-card__mail">
              <span className="mono">{company.email}</span>
              <button type="button" className="ct-copy mono" data-copy={company.email}>
                {t("Copy email")}
              </button>
            </div>
            <p className="ct-line-card__who">{t(company.name)}</p>
          </article>

          <article className="ct-line-card">
            <p className="ct-line-card__tag mono">
              <i></i>{t("Head office · Arifa Group")}
            </p>
            <a className="ct-line-card__num" href={`tel:${phone.office.tel}`}>
              {phone.office.label}
            </a>
            <div className="ct-line-card__actions">
              <a className="btn btn--line" href={`tel:${phone.office.tel}`}>
                <span className="btn__text" data-text={t("Call")}>
                  {t("Call")}
                </span>
              </a>
              <button type="button" className="ct-copy mono" data-copy={phone.office.label}>
                {t("Copy number")}
              </button>
            </div>
            <div className="ct-line-card__mail">
              <span className="mono">{company.group.email}</span>
              <button type="button" className="ct-copy mono" data-copy={company.group.email}>
                {t("Copy email")}
              </button>
            </div>
            <p className="ct-line-card__who">{t(company.group.name)}</p>
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
