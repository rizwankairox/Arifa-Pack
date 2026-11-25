/*
  A product's own page: the photo, what it is, its code and packing, and what to do next
  (add it to the enquiry list, or ask for a quote). Everything here comes from catalogue.json
  through src/data/catalogue.ts. The "Add to enquiry list" button is wired in
  src/sections/product/start.ts.
*/
import { neighbours } from '@/data/catalogue';
import type { Product } from '@/data/types';
import { isAr, lh, t } from '@/i18n';
import { Picture } from '@/components/site/Picture';

export function ProductDetail({ p }: { p: Product }) {
  const title = `${p.ref} ${p.name}`;
  const { prev, next } = neighbours(p);
  // arrows follow the reading direction: right to left on /ar
  const [back, fwd] = isAr() ? ['→', '←'] : ['←', '→'];
  const rows: [string, string][] = [
    [t('Product'), title],
    [t('Catalogue code'), p.code && p.code !== '—' ? p.code : t('On request')],
    [t('Packing'), p.qty || t('On request')],
    [t('Family'), p.familyName],
    [t('Range'), p.range === 'self' ? t('Arifa self range') : t('Trade')],
  ];
  // the CMS's details (src/data/catalogue.ts): each row only when it is filled in
  const d = p.details || {};
  const SPEC: [keyof NonNullable<typeof d.specs>, string][] = [
    ['material', 'Material'], ['capacity', 'Capacity'], ['dimensions', 'Dimensions'], ['thickness', 'Thickness'],
    ['colours', 'Colours'], ['lid_options', 'Lid options'], ['pieces_per_carton', 'Pieces per carton'],
  ];
  SPEC.forEach(([k, label]) => { const v = d.specs?.[k]; if (v && String(v).trim()) rows.push([t(label), String(v).trim()]); });
  const suits = (['oven', 'microwave', 'freezer'] as const).filter((k) => d.suitability?.[k]).map((k) => t(k[0].toUpperCase() + k.slice(1)));
  if (suits.length) rows.push([t('Suitable for'), suits.join(' · ')]);
  if (d.applications?.length) rows.push([t('Used for'), d.applications.join(', ')]);
  if (d.moq) rows.push([t('Minimum order'), d.moq]);
  return (
    <section className="pd" id="product" data-theme="light">
      <div className="wrap">
        <nav className="pd__crumbs mono" aria-label={t('Breadcrumb')}>
          <a href={lh('/products')} data-hover-line="">
            {t('Products')}
          </a>
          <span aria-hidden="true">/</span>
          <a href={lh(`/products?family=${p.family}`)} data-hover-line="">
            {p.familyName}
          </a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.ref}</span>
        </nav>

        <div className="pd__grid">
          <figure className="pd__media">
            {p.img ? (
              <Picture src={p.img} alt={title} width={720} height={474} decoding="async" fetchPriority="high" />
            ) : (
              <div className="pd__pending">
                <span>{p.ref}</span>
                <small className="mono">{t('Photo to follow')}</small>
              </div>
            )}
          </figure>

          <div className="pd__info">
            <p className="eyebrow pd__family">
              {p.familyName}
            </p>
            <p className="pd__ref">{p.ref}</p>
            <h1 className="pd__title">{p.name}</h1>
            {d.description && <p className="pd__desc">{d.description}</p>}
            {p.range === 'self' && <span className="pd__tag mono">{t('Arifa self range')}</span>}

            <dl className="qv__spec pd__spec">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            {d.datasheet && (
              <a className="link mono pd__sheet" href={d.datasheet} target="_blank" rel="noopener">
                {t('Download the datasheet')} ↗
              </a>
            )}

            {/* the other version of this product: its packet pack (old sr-… page), or the carton it packs */}
            {(p.pack || p.trade?.length) ? (
              <div className="pd__pack">
                <p className="mono pd__pack-k">{p.pack ? t('Also in the Arifa self range') : t('Trade carton')}</p>
                {(p.pack ? [p.pack] : p.trade!).map((o) => (
                  <a key={o.id} className="pd__pack-link" href={o.url}>
                    <span className="mono">{o.code}</span>
                    <span>{o.ref} {o.name} · {o.qty}</span>
                    <span aria-hidden="true">{fwd}</span>
                  </a>
                ))}
              </div>
            ) : null}

            <div className="pd__actions">
              <button
                className="btn btn--ink"
                type="button"
                aria-pressed="false"
                data-pd-enquire=""
                data-id={p.id}
                data-ref={p.ref}
                data-name={p.name}
                data-code={p.code}
                data-img={p.img || ''}
                data-family-name={p.familyName}
              >
                <span className="btn__text" data-text={t('Add to enquiry list')}>
                  {t('Add to enquiry list')}
                </span>
              </button>
              <a className="btn btn--leaf" href={lh('/contact')} data-magnetic="">
                <span className="btn__text" data-text={t('Request a quote')}>
                  {t('Request a quote')}
                </span>
                <span className="btn__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </span>
              </a>
            </div>
            <p className="pd__listed mono" data-pd-listed="" hidden>
              {t('In your enquiry list. Request a quote and it comes with you.')}
            </p>
            <p className="qv__note mono">{t('Specifications and lead times are confirmed by the packaging team with your quote.')}</p>

            <nav className="pd__steps mono" aria-label={t('More products')}>
              {prev ? (
                <a href={prev.url} rel="prev" data-hover-line="">
                  {back} {prev.ref}
                </a>
              ) : (
                <span />
              )}
              <a href={lh('/products')} data-hover-line="">
                {t('All products')}
              </a>
              {next ? (
                <a href={next.url} rel="next" data-hover-line="">
                  {next.ref} {fwd}
                </a>
              ) : (
                <span />
              )}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
