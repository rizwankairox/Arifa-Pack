/*
  04 · Walk the floor: seven clips from the factory, arrival to warehouse
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
            {t("Seven stops inside Arifa.")}
          </h2>
        </header>

        <div className="floor__track" data-floor-track="">
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/hero-exterior.webp"
                data-src="/media/clips/hero-exterior.mp4"
              ></video>
            </div>
            <h3>{t("Arrival")}</h3>
            <p>{t("The building on Al Jurf Industrial Area 2.")}</p>
          </article>
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/line-conveyor.webp"
                data-src="/media/clips/line-conveyor.mp4"
              ></video>
            </div>
            <h3>{t("Forming")}</h3>
            <p>{t("Container lines and their stackers.")}</p>
          </article>
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/pack-sleeve.webp"
                data-src="/media/clips/pack-sleeve.mp4"
              ></video>
            </div>
            <h3>{t("Lids")}</h3>
            <p>{t("Printed lids, fitted to every container.")}</p>
          </article>
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/foil-roll.webp"
                data-src="/media/clips/foil-roll.mp4"
              ></video>
            </div>
            <h3>{t("Foil")}</h3>
            <p>{t("Rewinding jumbo rolls into kitchen rolls.")}</p>
          </article>
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/pack-box.webp"
                data-src="/media/clips/pack-box.mp4"
              ></video>
            </div>
            <h3>{t("Packing")}</h3>
            <p>{t("Sleeved, shrink-wrapped, boxed.")}</p>
          </article>
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/moulding-robot.webp"
                data-src="/media/clips/moulding-robot.mp4"
              ></video>
            </div>
            <h3>{t("Cutlery")}</h3>
            <p>{t("Plastic forks and spoons, straight off the moulding line.")}</p>
          </article>
          <article className="chapter">
            <div className="chapter__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/warehouse-walk.webp"
                data-src="/media/clips/warehouse-walk.mp4"
              ></video>
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
