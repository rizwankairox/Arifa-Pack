/*
  03 · certificates & documents
*/
import { t, lh } from '@/i18n';
export function Documents() {
  return (
    <section className="q-docs" id="documents" data-theme="dark">
      <div className="wrap q-docs__grid">
        <div>
          <p className="eyebrow">
            {t("Certificates & documents")}
          </p>
          <h2 className="q-h2">
            {t("Need paperwork")}{' '}<span className="is-dim">{t("for a tender or an audit?")}</span>
          </h2>
        </div>
        <div className="q-docs__card">
          {/* Certificates appear here only once Arifa provides them. Add each one as:
               <article class="q-cert"><span class="q-cert__issuer mono">Issuer</span><h3>Standard name</h3>
                 <p>Scope · valid until YYYY-MM</p><a class="link mono" href="/docs/file.pdf">View certificate</a></article> */}
          <div className="q-docs__stack" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <p>
            {t("Ask for certificates, test reports or a product specification with your enquiry. The packaging team will tell you what is available for the products you need.")}
          </p>
          <a className="btn btn--leaf" href={lh("/contact")} data-magnetic="">
            <span className="btn__text" data-text={t("Ask for documents")}>
              {t("Ask for documents")}
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
