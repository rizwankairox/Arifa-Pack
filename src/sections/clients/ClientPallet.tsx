/*
  01 · clients: the pallet. Each client is a carton with its logo printed on the side; on scroll
         the cartons tumble in split open, fold shut, get taped and printed, and stack onto the pallet,
         which is then stretch-wrapped (src/sections/clients/clientsPage.ts)
*/
import { ClientLogos, ClientsNote } from './ClientLogos';
import { t } from '@/i18n';

export function ClientPallet() {
  return (
    <section className="cl-pallet" id="clients" data-theme="light">
      <div className="wrap">
        <header className="cl-pallet__head">
          <p className="eyebrow">
            {t("Our clients")}
          </p>
          <h2 className="cl-h2">
            {t("Packed and")}
            <br />
            <span className="is-dim">{t("shipped to.")}</span>
          </h2>
        </header>
        <div className="pallet-track">
          <div className="pallet-pin">
            <div className="pallet">
              <ul className="pallet__stack" data-logos="">
                <ClientLogos />
              </ul>
              <span className="pallet__film" aria-hidden="true"></span>
              <span className="pallet__base" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
            <p className="cl-pallet__note mono">
              <ClientsNote />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
