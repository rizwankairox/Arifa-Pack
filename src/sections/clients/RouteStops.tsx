/*
  The delivery route: each industry is a stop, with its use, its product kit and a quote link.
  The page's script pins it over the 3D town (clientsPage.ts); without it, the stops simply stack.
*/
import { getCatalogue, productsIn } from '@/data/catalogue';
import { getClients } from '@/data/clients';
import { pad2, plural } from '@/lib/format';
import { SampleTag } from './SampleTag';
import { lh, t } from '@/i18n';

/** the enquiry desk, pre-filled with this kind of business and its product families */
export const quoteLink = (trade: string, families: string[]) =>
  lh(`/contact?trade=${encodeURIComponent(trade)}&families=${families.map(encodeURIComponent).join(',')}`);

export function RouteStops() {
  const cat = getCatalogue();
  const fam = new Map(cat.families.map((f) => [f.id, f]));
  const photo = (id: string) => cat.products.find((p) => p.family === id && p.img)?.img;
  const inds = getClients().industries;
  const n = inds.length;
  return (
    <>
      <ol className="route__stops">
        {inds.map((d, i) => {
          const shown = d.families.filter((id) => fam.has(id));
          return (
            <li
              key={d.id}
              className={`route__stop${i === 0 ? ' is-active' : ''}`}
              id={`ind-${d.id}`}
              data-stop=""
              data-id={d.id}
              data-label={d.label || d.name}
            >
              <p className="route__kicker mono">
                {t("Stop")}{' '}{pad2(i + 1)} / {pad2(n)}{' '}{t("· Delivered from Ajman")}
              </p>
              <h3 className="route__name">
                {d.name}
                {d.sample && (
                  <>
                    {' '}
                    <SampleTag />
                  </>
                )}
              </h3>
              <p className="route__use">{d.use}</p>
              <ul className="route__kit">
                {shown.slice(0, 4).map((id) => {
                  const img = photo(id);
                  return (
                    <li key={id}>
                      <a className="kit" href={lh(`/products?family=${encodeURIComponent(id)}`)}>
                        <span className="kit__img">
                          {img && <img src={img} alt="" loading="lazy" decoding="async" width={720} height={474} />}
                        </span>
                        <span className="kit__name">{fam.get(id)!.name}</span>
                        <span className="kit__count mono">{t(plural(productsIn(cat, id).length))}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              {shown.length > 4 && <p className="route__more mono">+ {shown.length - 4}{' '}{t("more families")}</p>}
              <a className="btn btn--leaf" href={quoteLink(d.trade, d.families)} data-magnetic="">
                <span className="btn__text" data-text={`${t('Quote for')} ${d.short}`}>
                  {t("Quote for")}{' '}{d.short}
                </span>
                <span className="btn__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <nav className="route__nav" aria-label={t("Delivery stops")}>
        {inds.map((d, i) => (
          <button key={d.id} className="route__go" type="button" data-route-go={i}>
            <span className="mono">{pad2(i + 1)}</span>
            {d.label || d.name}
          </button>
        ))}
      </nav>
    </>
  );
}
