/*
  The loader: a curtain with the logo drawn on it, and a count to 100 along its foot.
  At home it is the hero's own dark, and the logo rises into the nav as the stage lights up
  beneath it. (Behaviour: src/motion/loader.ts.)
*/
import { t } from '@/i18n';
export function Loader() {
  return (
    <div className="loader" data-loader="" aria-hidden="true">
      <div className="loader__shutter" data-shutter="">
        {/* data-handoff-from: on pages that carry a matching [data-handoff], these fly into the page instead of leaving with the curtain */}
        <div className="loader__foot">
          <span className="mono" data-handoff-from="company">
            {t("Arifa Packing & Packaging LLC")}
          </span>
          <span className="loader__count mono">
            <span data-count="">000</span>%
          </span>
          <span className="mono" data-handoff-from="place">
            {t("Al Jurf · Ajman · UAE")}
          </span>
        </div>
        <div className="loader__bar" data-handoff-from="rule">
          <i data-loader-bar=""></i>
        </div>
        <div className="loader__lip"></div>
      </div>
      {/* home: the stage light, already on as the curtain lets go */}
      <div className="loader__stage" data-intro-stage="">
        <div className="loader__beam" data-intro-beam=""></div>
      </div>
      {/* the mark lives outside the shutter so it can fly to the nav (or, at home, onto the stage) */}
      <div className="loader__center">
        <div className="loader__brand" data-loader-brand=""></div>
        <p className="loader__line mono">
          <span>{t("Opening the factory floor")}</span>
        </p>
      </div>
      <button className="loader__skip mono" type="button" tabIndex={-1} data-intro-skip="">
        {t("Skip intro")}{' '}<span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
