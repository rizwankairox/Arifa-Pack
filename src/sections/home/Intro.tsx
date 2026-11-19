/*
  01 · Intro statement
*/
import { t } from '@/i18n';
export function Intro() {
  return (
    <section className="intro" data-theme="light" aria-labelledby="intro-label">
      <div className="wrap">
        <p className="eyebrow" id="intro-label">
          <span className="mono">(01)</span>{' '}{t("The company")}
        </p>
        <p className="intro__text" data-words="">
          {t("We press aluminium coil")}
          <span className="pill" aria-hidden="true">
            <video muted loop playsInline preload="none" poster="/media/posters/coil.webp" data-clip="small" data-src="/media/clips/coil.mp4"></video>
          </span>
          {t("into food containers, rewind foil")}
          <span className="pill" aria-hidden="true">
            <video
              muted
              loop
              playsInline
              preload="none"
              poster="/media/posters/foil-roll.webp"
              data-clip="small" data-src="/media/clips/foil-roll.mp4"
            ></video>
          </span>
          {t("into kitchen rolls, mould cutlery")}
          <span className="pill" aria-hidden="true">
            <video
              muted
              loop
              playsInline
              preload="none"
              poster="/media/posters/moulding-cutlery.webp"
              data-clip="small" data-src="/media/clips/moulding-cutlery.mp4"
            ></video>
          </span>
          {t("and pack every carton")}
          <span className="pill" aria-hidden="true">
            <video
              muted
              loop
              playsInline
              preload="none"
              poster="/media/posters/pack-tape.webp"
              data-clip="small" data-src="/media/clips/pack-tape.mp4"
            ></video>
          </span>
          {t("— under one roof in Ajman.")}
        </p>

        <div className="intro__facts">
          <div className="fact">
            <span className="fact__n" data-count-to="8" data-pad="2">
              00
            </span>
            <span className="fact__l">{t("Product families, from containers to cling film")}</span>
          </div>
          <div className="fact">
            <span className="fact__n" data-count-to="19" data-pad="2">
              00
            </span>
            <span className="fact__l">{t("Aluminium container references in the current catalogue")}</span>
          </div>
          <div className="fact">
            <span className="fact__n" data-count-to="4" data-pad="2">
              00
            </span>
            <span className="fact__l">{t("Arifa self-range lines: containers, platters, pots, microwave")}</span>
          </div>
          <div className="fact">
            <span className="fact__n">
              08<small>–</small>20
            </span>
            <span className="fact__l">{t("Open Monday to Saturday, Ajman time")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
