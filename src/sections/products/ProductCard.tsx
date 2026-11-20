/*
  One product in the catalogue grid. Every product is in the page's HTML (so search engines see
  them all) and links to its own page (/products/<id>); the page's script only decides which are
  visible (catalogue.ts) and opens the quick view (quickView.ts) or adds it to the enquiry list (tray.ts).
*/
import type { Product } from '@/data/types';
import { isAr, t } from '@/i18n';
import { Picture } from '@/components/site/Picture';

export function ProductCard({ p, index }: { p: Product; index: number }) {
  const self = p.range === 'self';
  const title = `${p.ref} ${p.name}`;
  const search = [p.ref, p.name, p.nameEn || '', p.code, p.familyName, self ? 'self range arf' : ''].join(' ').toLowerCase();
  return (
    <article
      className={`pcard${self ? ' is-self is-hidden' : ''}`}
      data-product={p.id}
      data-family={p.family}
      data-range={p.range}
      data-search={search}
      style={{ '--i': index } as CSSVars}
    >
      <div className="pcard__tilt">
        <div className="pcard__media">
          {p.img ? (
            <Picture src={p.img} alt={title} loading="lazy" decoding="async" width={720} height={474} />
          ) : (
            <div className="pcard__pending">
              <span>{p.ref}</span>
              <small className="mono">{t("Photo to follow")}</small>
            </div>
          )}
        </div>
        <div className="pcard__body">
          <p className="pcard__ref">
            <span>{p.ref}</span>
          </p>
          <h3 className="pcard__name">{p.name}</h3>
          <dl className="pcard__spec mono">
            {p.code && p.code !== '—' && (
              <div>
                <dt>{t("Code")}</dt>
                <dd>{p.code}</dd>
              </div>
            )}
            {p.qty && (
              <div>
                <dt>{t("Pack")}</dt>
                <dd>{p.qty}</dd>
              </div>
            )}
          </dl>
        </div>
        {self && <span className="pcard__tag mono">{t("Self range")}</span>}
      </div>
      {/* a real link to the product's own page (for search engines, new tabs and no-script visitors);
          a plain click opens the quick view instead (catalogueClient.ts) */}
      <a className="pcard__hit" href={p.url} data-qv-open="" aria-label={t('Open {title}', { title })} data-cursor-text={isAr() ? 'افتح' : 'Open'}></a>
      <button className="pcard__add" type="button" data-enquire="" aria-pressed="false" aria-label={t('Add {title} to enquiry list', { title })}>
        <i></i>
        <i></i>
      </button>
    </article>
  );
}
