/*
  04 · Walk the floor: seven clips from the factory, arrival to warehouse
*/
import { t } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';
import { cmsCollection } from '@/lib/content';

export function FactoryFloor() {
  // the seven stops' names and lines: the CMS "tour_chapters" collection (in order) when it is
  // connected, else as written here. The clips stay with their stop.
  const cms = cmsCollection<{ title?: string; text?: string }>('tour_chapters');
  const chapter = (i: number, field: 'title' | 'text', fallback: string) => cms?.[i]?.[field]?.trim() || fallback;
  return (
    <section className="floor" id="floor" data-theme="dark" data-floor="">
      <div className="floor__pin">
        <header className="floor__head">
          <p className="eyebrow">
            <CmsText section="floor" field="eyebrow">{t("Walk the floor")}</CmsText>
          </p>
          <h2 className="floor__title" data-split-lines="">
            <CmsText section="floor" field="heading">{t("Seven stops inside Arifa.")}</CmsText>
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
            <h3>{chapter(0, "title", t("Arrival"))}</h3>
            <p>{chapter(0, "text", t("The building on Al Jurf Industrial Area 2."))}</p>
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
            <h3>{chapter(1, "title", t("Forming"))}</h3>
            <p>{chapter(1, "text", t("Container lines and their stackers."))}</p>
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
            <h3>{chapter(2, "title", t("Lids"))}</h3>
            <p>{chapter(2, "text", t("Printed lids, fitted to every container."))}</p>
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
            <h3>{chapter(3, "title", t("Foil"))}</h3>
            <p>{chapter(3, "text", t("Rewinding jumbo rolls into kitchen rolls."))}</p>
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
            <h3>{chapter(4, "title", t("Packing"))}</h3>
            <p>{chapter(4, "text", t("Sleeved, shrink-wrapped, boxed."))}</p>
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
            <h3>{chapter(5, "title", t("Cutlery"))}</h3>
            <p>{chapter(5, "text", t("Plastic forks and spoons, straight off the moulding line."))}</p>
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
            <h3>{chapter(6, "title", t("Warehouse"))}</h3>
            <p>{chapter(6, "text", t("Labelled, racked and ready to dispatch."))}</p>
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
