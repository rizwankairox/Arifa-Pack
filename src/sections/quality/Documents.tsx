/*
  03 · certificates & documents
*/
import { t, lh } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';
import { cmsCollection } from '@/lib/content';

type Cert = { title?: string; issuer?: string; scope?: string; valid_until?: string; file?: { src?: string } };

export function Documents() {
  const certs = (cmsCollection<Cert>('certificates') || []).filter((c) => c.title);
  return (
    <section className="q-docs" id="documents" data-theme="dark">
      <div className="wrap q-docs__grid">
        <div>
          <p className="eyebrow">
            <CmsText section="documents" field="eyebrow">{t("Certificates & documents")}</CmsText>
          </p>
          <h2 className="q-h2">
            <CmsText section="documents" field="heading">{t("Need paperwork")}{' '}<span className="is-dim">{t("for a tender or an audit?")}</span></CmsText>
          </h2>
        </div>
        <div className="q-docs__card">
          {/* Certificates appear here once Arifa publishes them in the CMS ("certificates" collection) */}
          {certs.map((c) => (
            <article className="q-cert" key={c.key}>
              {c.issuer && <span className="q-cert__issuer mono">{c.issuer}</span>}
              <h3>{c.title}</h3>
              {(c.scope || c.valid_until) && <p>{[c.scope, c.valid_until && `${t("valid until")} ${c.valid_until}`].filter(Boolean).join(' · ')}</p>}
              {c.file?.src && (
                <a className="link mono" href={c.file.src} target="_blank" rel="noopener">
                  {t("View certificate")}
                </a>
              )}
            </article>
          ))}
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
