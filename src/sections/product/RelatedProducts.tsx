/*
  "More from this family" on a product page: up to four other products, each linking to its own page.
*/
import { productsIn, getCatalogue, relatedProducts } from '@/data/catalogue';
import type { Product } from '@/data/types';
import { lh, t } from '@/i18n';
import { Picture } from '@/components/site/Picture';

export function RelatedProducts({ p }: { p: Product }) {
  const related = relatedProducts(p, 4);
  if (!related.length) return null;
  const total = productsIn(getCatalogue(), p.family).length;
  return (
    <section className="pd-more" data-theme="light" aria-labelledby="pd-more-title">
      <div className="wrap">
        <header className="pd-more__head">
          <h2 className="pd-more__title" id="pd-more-title">
            {t('More from {family}', { family: p.familyName })}
          </h2>
          <a className="link mono" href={lh(`/products?family=${p.family}`)}>
            {t('All {n} in this family →', { n: total })}
          </a>
        </header>
        <ul className="pd-more__grid">
          {related.map((o) => (
            <li key={o.id}>
              <a className="pd-card" href={o.url}>
                <span className="pd-card__media">
                  {o.img ? (
                    <Picture src={o.img} alt="" loading="lazy" decoding="async" width={720} height={474} />
                  ) : (
                    <span className="pd-card__pending mono">{t('Photo to follow')}</span>
                  )}
                </span>
                <span className="pd-card__ref">{o.ref}</span>
                <span className="pd-card__name">{o.name}</span>
                <span className="pd-card__spec mono">
                  {[o.code && o.code !== '—' ? o.code : '', o.qty].filter(Boolean).join(' · ')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
