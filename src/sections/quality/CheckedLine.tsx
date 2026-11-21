/*
  01 · the line, checked: seven stations from coil to dispatch, scrolled sideways
*/
import { t } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';
import { cmsCollection } from '@/lib/content';

export function CheckedLine() {
  // the seven stations' names and lines: the CMS "stations" collection (in order) when it is
  // connected, else as written here. The clips stay with their station.
  const cms = cmsCollection<{ title?: string; text?: string }>('stations');
  const station = (i: number, field: 'title' | 'text', fallback: string) => cms?.[i]?.[field] || fallback;
  return (
    <section className="q-line-sec" id="line" data-theme="dark" data-qline="" aria-labelledby="line-title">
      <div className="q-line-sec__pin" data-qpin="">
        <header className="wrap q-line-sec__head">
          <p className="eyebrow">
            <CmsText section="line" field="eyebrow">{t("The line, checked")}</CmsText>
          </p>
          <h2 className="q-h2" id="line-title">
            <CmsText section="line" field="heading">{t("From coil")}{' '}<span className="is-dim">{t("to carton.")}</span></CmsText>
          </h2>
          <p className="q-line-sec__count mono" aria-hidden="true">
            <span data-qcount="">01</span> / 07{' '}
            <span className="q-line-sec__stage" data-qstage="">
              {station(0, "title", t("Material in"))}
            </span>
          </p>
        </header>

        <div className="q-track" data-qtrack="">
          <ol className="q-stations">
            <li className="q-station" data-station="" data-name={station(0, "title", t("Material in"))}>
              <div className="q-station__media">
                <video muted loop playsInline preload="none" poster="/media/posters/coil.webp" data-src="/media/clips/coil.mp4"></video>
              </div>
              <span className="q-station__n mono">01</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(0, "title", t("Material in"))}</h3>
                <p>{station(0, "text", t("An aluminium coil comes in on the forklift, ready for the line."))}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={station(1, "title", t("Forming"))}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/line-stack.webp"
                  data-src="/media/clips/line-stack.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">02</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(1, "title", t("Forming"))}</h3>
                <p>{station(1, "text", t("Containers are formed on the line and stack up as they come off it."))}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={station(2, "title", t("Machine control"))}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/control-panel.webp"
                  data-src="/media/clips/control-panel.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">03</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(2, "title", t("Machine control"))}</h3>
                <p>{station(2, "text", t("An operator in a hairnet sets and watches the machine from its panel."))}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={station(3, "title", t("Lids & matching"))}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/lid-sheets.webp"
                  data-src="/media/clips/lid-sheets.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">04</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(3, "title", t("Lids & matching"))}</h3>
                <p>{station(3, "text", t("Gloved hands match lids to their containers."))}</p>
              </div>
            </li>
            <li className="q-station q-station--key" data-station="" data-name={station(4, "title", t("Quality check"))}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/inspect.webp"
                  data-src="/media/clips/inspect.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">05</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(4, "title", t("Quality check"))}</h3>
                <p>{station(4, "text", t("Products are lifted to the light and checked by eye."))}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={station(5, "title", t("Packing"))}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/pack-sleeve.webp"
                  data-src="/media/clips/pack-sleeve.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">06</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(5, "title", t("Packing"))}</h3>
                <p>{station(5, "text", t("Sleeved in Arifa packaging and packed into Arifa cartons."))}</p>
              </div>
            </li>
            <li className="q-station" data-station="" data-name={station(6, "title", t("Sealed & dispatched"))}>
              <div className="q-station__media">
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/media/posters/warehouse-forklift.webp"
                  data-src="/media/clips/warehouse-forklift.mp4"
                ></video>
              </div>
              <span className="q-station__n mono">07</span>
              <span className="q-station__ok mono" aria-hidden="true">
                <b>✓</b>{' '}{t("Checked")}
              </span>
              <div className="q-station__body">
                <h3>{station(6, "title", t("Sealed & dispatched"))}</h3>
                <p>{station(6, "text", t("Cartons are taped, palletised and moved to dispatch."))}</p>
              </div>
            </li>
          </ol>
        </div>
        <p className="wrap q-line-sec__note mono">{t("Every station is our own footage, filmed in Al Jurf, Ajman.")}</p>
      </div>
    </section>
  );
}
