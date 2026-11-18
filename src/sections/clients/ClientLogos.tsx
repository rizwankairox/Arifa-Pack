/*
  "The pallet": every client as a carton, built as a box. Its front is the printed side (the logo,
  the industry, the front of the tape); behind its top edge is the top, seen a little from above,
  with its two flaps meeting down the middle and the tape along the seam. The page's script drops
  each one onto the stack with its top open and folds it shut (clientsPage.ts).
*/
import { getClients } from '@/data/clients';
import { SampleTag } from './SampleTag';
import { t } from '@/i18n';

export function ClientLogos() {
  const data = getClients();
  const names = new Map(data.industries.map((d) => [d.id, d.name]));
  return (
    <>
      {data.clients.map((c) => (
        <li key={c.name} className="crate">
          <span className="crate__box">
            <span className="crate__top" aria-hidden="true">
              <span className="crate__lid crate__lid--l"></span>
              <span className="crate__lid crate__lid--r"></span>
              <span className="crate__tape crate__tape--top"></span>
            </span>
            <span className="crate__front">
              <img className="crate__logo" src={c.logo} alt={c.name} loading="lazy" decoding="async" width={260} height={64} />
              <span className="crate__ind mono">{names.get(c.industry) || ''}</span>
              {c.sample && <SampleTag />}
              <span className="crate__tape crate__tape--front" aria-hidden="true"></span>
            </span>
          </span>
        </li>
      ))}
    </>
  );
}

/** a line under the pallet: honest about whether these are real logos yet */
export function ClientsNote() {
  return getClients().clients.some((c) => c.sample)
    ? t('Sample logos shown for layout. They are replaced with approved client logos before launch.')
    : t('Logos are shown with each client’s permission.');
}
