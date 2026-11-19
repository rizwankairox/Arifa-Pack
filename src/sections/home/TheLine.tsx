/*
  02 · The line (3D)
*/
import { SceneCanvas } from '@/three/SceneCanvas';
import { SkipScene } from '@/components/site/SkipScene';
import { t } from '@/i18n';

export function TheLine() {
  return (
    <section className="line" id="factory" data-theme="dark" data-line="">
      {/* One press, one shot, scrubbed by scroll (src/three/scenes/PressScene.ts); it melts away into the range below. */}
      <div className="line__sticky">
        <SkipScene />
        <SceneCanvas name="line" className="line__gl" dataAttr="data-line-gl" />
        <video
          className="line__film"
          data-line-film=""
          muted
          loop
          playsInline
          preload="none"
          data-src="/media/clips/lid-macro.mp4"
          aria-hidden="true"
        ></video>
        <div className="line__ui" data-line-ui="">
          <header className="line__head">
            <p className="eyebrow">
              <span className="mono">(02)</span>{' '}{t("The line")}
            </p>
            <h2 className="line__title">
              {t("How an")}{' '}<span className="line__code">83185</span>{' '}{t("container is made")}
            </h2>
          </header>
          <ol className="line__steps">
            <li className="line__step is-active" data-step-at="0">
              <span className="line__step-n mono">{t("01 · Press")}</span>
              <p>{t("The punch cuts a blank from the strip and draws it into the die in a single stroke.")}</p>
            </li>
            <li className="line__step" data-step-at="0.36">
              <span className="line__step-n mono">{t("02 · Form")}</span>
              <p>{t("Spare metal gathers into the corner pleats. The rim is curled so the edge is smooth and rigid.")}</p>
            </li>
            <li className="line__step" data-step-at="0.57">
              <span className="line__step-n mono">{t("03 · Lid")}</span>
              <p>{t("Each container has a matching embossed lid that folds over the curled rim to close.")}</p>
            </li>
          </ol>
          <div className="line__meter mono" aria-hidden="true">
            <span>
              <b data-line-step="">01</b> / 03
            </span>
            <i>
              <b data-line-bar=""></b>
            </i>
            <span className="line__spec">{t("83185 · AC-5 · 1 × 400 pcs")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
