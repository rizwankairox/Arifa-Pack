/*
  01 · the line, checked: seven stations from coil to dispatch, scrolled sideways
*/
import { t } from '@/i18n';
export function CheckedLine() {
  return (
    <section className="q-line-sec" id="line" data-theme="dark" data-qline="" aria-labelledby="line-title">
      <div className="q-line-sec__pin" data-qpin="">
        <header className="wrap q-line-sec__head">
          <p className="eyebrow">
            <span className="mono">(01)</span>{' '}{t("The line, checked")}
          </p>
          <h2 className="q-h2" id="line-title">
            {t("From coil")}{' '}<span className="is-dim">{t("to carton.")}</span>
          </h2>
          <p className="q-line-sec__count mono" aria-hidden="true">
            <span data-qcount="">01</span> / 07{' '}
            <span className="q-line-sec__stage" data-qstage="">
              {t("Material in")}
            </span>
          </p>
        </header>

        <div className="q-track" data-qtrack="">
          <ol className="q-stations">
            <li className="q-station" data-station="" data-name={t("Material in")}>
              <div className="q-station__media">
                <video muted loop playsInline preload="none" poster="/media/posters/coil.jpg" data-src="/media/clips/coil.mp4"></video>
              </div>
              <span className="q-station__n mono">01</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Material in")}</h3>
                <p>{t("An aluminium coil comes in on the forklift, ready for the line.")}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={t("Forming")}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/line-stack.jpg"
                  data-src="/media/clips/line-stack.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">02</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Forming")}</h3>
                <p>{t("Containers are formed on the line and stack up as they come off it.")}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={t("Machine control")}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/control-panel.jpg"
                  data-src="/media/clips/control-panel.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">03</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Machine control")}</h3>
                <p>{t("An operator in a hairnet sets and watches the machine from its panel.")}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={t("Lids & matching")}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/lid-sheets.jpg"
                  data-src="/media/clips/lid-sheets.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">04</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Lids & matching")}</h3>
                <p>{t("Gloved hands match lids to their containers.")}</p>
              </div>
            </li>
            <li className="q-station q-station--key" data-station="" data-name={t("Quality check")}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/inspect.jpg"
                  data-src="/media/clips/inspect.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">05</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Quality check")}</h3>
                <p>{t("Products are lifted to the light and checked by eye.")}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={t("Packing")}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/pack-sleeve.jpg"
                  data-src="/media/clips/pack-sleeve.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">06</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Packing")}</h3>
                <p>{t("Sleeved in Arifa packaging and packed into Arifa cartons.")}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={t("Sealed & dispatched")}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/warehouse-forklift.jpg"
                  data-src="/media/clips/warehouse-forklift.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">07</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{t("Sealed & dispatched")}</h3>
                <p>{t("Cartons are taped, palletised and moved to dispatch.")}</p>
              </div>
            </li>
          </ol>
        </div>
        <p className="wrap q-line-sec__note mono">{t("Every station is our own footage, filmed in Al Jurf, Ajman.")}</p>
      </div>
    </section>
  );
}
