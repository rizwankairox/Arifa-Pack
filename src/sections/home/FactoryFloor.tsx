/*
  04 · Walk the floor (film chapters)
*/
import { t } from '@/i18n';
export function FactoryFloor() {
  return (
    <section className="floor" id="floor" data-theme="dark" data-floor="">
      <div className="floor__pin">
        <header className="floor__head">
          <p className="eyebrow">
            <span className="mono">(04)</span>{' '}{t("Walk the floor")}
          </p>
          <h2 className="floor__title" data-split-lines="">
            {t("Two minutes and twenty seconds inside Arifa.")}
          </h2>
          <button className="btn btn--light" type="button" data-film-open="" data-t="0" data-magnetic="">
            <span className="btn__text" data-text={t("Play the full film")}>
              {t("Play the full film")}
            </span>
            <span className="btn__icon">
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            </span>
          </button>
        </header>

        <div className="floor__track" data-floor-track="">
          <article className="chapter" data-film-open="" data-t="16.3" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/hero-exterior.jpg"
                data-src="/media/clips/hero-exterior.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 01")}</span>
              <span>00:16</span>
            </div>
            <h3>{t("Arrival")}</h3>
            <p>{t("The building on Al Jurf Industrial Area 2.")}</p>
          </article>
          <article className="chapter" data-film-open="" data-t="24.2" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/line-conveyor.jpg"
                data-src="/media/clips/line-conveyor.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 02")}</span>
              <span>00:24</span>
            </div>
            <h3>{t("Forming")}</h3>
            <p>{t("Container lines and their stackers.")}</p>
          </article>
          <article className="chapter" data-film-open="" data-t="73.4" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/lid-macro.jpg"
                data-src="/media/clips/lid-macro.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 03")}</span>
              <span>01:13</span>
            </div>
            <h3>{t("Lids")}</h3>
            <p>{t("Embossed lids, stamped with the code.")}</p>
          </article>
          <article className="chapter" data-film-open="" data-t="82.8" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/foil-roll.jpg"
                data-src="/media/clips/foil-roll.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 04")}</span>
              <span>01:22</span>
            </div>
            <h3>{t("Foil")}</h3>
            <p>{t("Rewinding jumbo rolls into kitchen rolls.")}</p>
          </article>
          <article className="chapter" data-film-open="" data-t="101.4" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/pack-sleeve.jpg"
                data-src="/media/clips/pack-sleeve.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 05")}</span>
              <span>01:41</span>
            </div>
            <h3>{t("Packing")}</h3>
            <p>{t("Sleeved, shrink-wrapped, boxed.")}</p>
          </article>
          <article className="chapter" data-film-open="" data-t="112.1" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/moulding-robot.jpg"
                data-src="/media/clips/moulding-robot.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 06")}</span>
              <span>01:52</span>
            </div>
            <h3>{t("Moulding")}</h3>
            <p>{t("Plastic lines for microwave ware and cutlery.")}</p>
          </article>
          <article className="chapter" data-film-open="" data-t="120.1" data-cursor-text={t("Play")}>
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/warehouse-walk.jpg"
                data-src="/media/clips/warehouse-walk.mp4"
              ></video>
            </div>
            <div className="chapter__meta mono">
              <span>{t("CH. 07")}</span>
              <span>02:00</span>
            </div>
            <h3>{t("Warehouse")}</h3>
            <p>{t("Labelled, racked and ready to dispatch.")}</p>
          </article>
        </div>

        <div className="floor__progress mono" aria-hidden="true">
          <span>{t("Drag or scroll")}</span>
          <i>
            <b data-floor-bar=""></b>
          </i>
          <span data-floor-count="">01 / 07</span>
        </div>
      </div>
    </section>
  );
}
