/*
  06 · Contact / quote
*/
import { t, lh } from '@/i18n';
import { company, phone } from '@/data/site';
import { CmsText } from '@/components/site/CmsText';
export function QuoteSection() {
  return (
    <section className="contact" id="contact" data-theme="dark">
      <div className="wrap contact__grid">
        <div className="contact__intro">
          <p className="eyebrow">
            <CmsText section="contact" field="eyebrow">{t("Request a quote")}</CmsText>
          </p>
          <h2 className="contact__title" data-split-lines="">
            <CmsText section="contact" field="heading">{t("Tell us what you need packed.")}</CmsText>
          </h2>
          <p className="contact__lede">
            <CmsText section="contact" field="body">{t("Share the product, an approximate quantity and where it's going. The packaging team will come back to you during working hours.")}</CmsText>
          </p>

          <dl className="contact__details">
            <div>
              <dt className="mono">{t("Head office & factory")}</dt>
              <dd>
                {t("Al Jurf Industrial Area 2")}<br />
                {t("Ajman, United Arab Emirates")}
                <br />
                <a
                  className="link"
                  href={company.maps}
                  target="_blank"
                  rel="noopener"
                >
                  {t("Open in Maps")}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono">{t("Office")}</dt>
              <dd>
                <a className="link" href={`tel:${phone.office.tel}`}>
                  {phone.office.label}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono">{t("Packaging division")}</dt>
              <dd>
                <a className="link" href={`tel:${phone.packaging.tel}`}>
                  {phone.packaging.label}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono">{t("Email")}</dt>
              <dd>
                <a className="link" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono">{t("Hours")}</dt>
              <dd>
                {t(company.hoursLong)}
                <br />
                {t("Sunday closed")}
                <br />
                <span className="open-state mono" data-open-state=""></span>
              </dd>
            </div>
          </dl>
        </div>

        {/* the enquiry itself lives on the contact page (one form, one place); this band sends you there */}
        <div className="quote-cta">
          <p className="quote-cta__step mono">
            <span>01</span>{' '}{t("Contents")}{' '}<span>02</span>{' '}{t("Quantity")}{' '}<span>03</span>{' '}{t("Delivery")}{' '}<span>04</span>{' '}{t("From")}{' '}<span>05</span>{' '}{t("Reply")}{' '}
            <span>06</span>{' '}{t("Notes")}
          </p>
          <p className="quote-cta__lead">
            {t("Six quick answers, written up on a label as you go. Products saved in your enquiry list come with you.")}
          </p>
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
        </div>
      </div>
    </section>
  );
}
