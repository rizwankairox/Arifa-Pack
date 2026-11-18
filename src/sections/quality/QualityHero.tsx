/*
  00 · hero: the quality check, through a viewfinder
*/
import { t } from '@/i18n';
export function QualityHero() {
  return (
    <section className="q-hero" id="top" data-theme="dark">
      <div className="q-hero__glow" aria-hidden="true"></div>
      <div className="wrap q-hero__grid">
        <div className="q-hero__text">
          <p className="eyebrow">
            <span className="mono">{t("(Quality)")}</span>{' '}{t("Quality & Sustainability")}
          </p>
          <h1 className="q-title">
            <span className="q-line">
              <span>{t("Shown,")}</span>
            </span>{' '}
            <span className="q-line">
              <span className="is-dim">{t("not claimed.")}</span>
            </span>
          </h1>
          <p className="q-lede">
            {t("Arifa Packing maintains strict quality control standards throughout production, so every client gets packaging that is consistent and reliable. Here is what that looks like on our floor in Al Jurf, Ajman.")}
          </p>
          <ul className="q-proofs" aria-label={t("The evidence on this page")}>
            <li>
              <i className="q-tag q-tag--film"></i>
              <span>{t("Factory footage")}</span>
            </li>
            <li>
              <i className="q-tag q-tag--cat"></i>
              <span>{t("Catalogue counts")}</span>
            </li>
            <li>
              <i className="q-tag q-tag--doc"></i>
              <span>{t("Documents on request")}</span>
            </li>
          </ul>
        </div>
        <figure className="q-finder" aria-label={t("Factory footage: a product held up to the light and checked")}>
          <video
            className="q-finder__film"
            muted
            loop
            playsInline
            preload="none"
            poster="/media/posters/inspect.jpg"
            data-src="/media/clips/inspect.mp4"
            data-finder=""
          ></video>
          <span className="q-finder__corner q-finder__corner--tl" aria-hidden="true"></span>
          <span className="q-finder__corner q-finder__corner--tr" aria-hidden="true"></span>
          <span className="q-finder__corner q-finder__corner--bl" aria-hidden="true"></span>
          <span className="q-finder__corner q-finder__corner--br" aria-hidden="true"></span>
          <span className="q-finder__focus" aria-hidden="true"></span>
          <figcaption className="q-finder__hud mono">
            <span className="q-finder__rec">
              <i></i>{t("Factory footage · Al Jurf, Ajman")}
            </span>
            <span data-timecode="">00:00:00:00</span>
          </figcaption>
          <p className="q-finder__check mono" aria-hidden="true">
            <b>✓</b>{' '}{t("Quality check")}
          </p>
        </figure>
      </div>
      <a className="q-cue mono" href="#line">
        <i aria-hidden="true"></i>{t("Follow the line")}
      </a>
    </section>
  );
}
