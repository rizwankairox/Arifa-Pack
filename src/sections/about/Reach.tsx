/*
  03 · from Ajman to the world: the factory folds into a pin on the UAE map, the map widens to the world
*/
import { SceneCanvas } from '@/three/SceneCanvas';
import { SkipScene } from '@/components/site/SkipScene';
import { t } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';

export function Reach() {
  return (
    <section className="ab-reach" id="reach" data-theme="light" aria-labelledby="reach-title" data-reach="">
      <div className="ab-reach__stage" data-reach-stage="">
        <SkipScene />
        <svg className="ab-reach__map" data-reach-map="" aria-hidden="true" />
        <SceneCanvas name="reach" className="ab-reach__gl" dataAttr="data-reach-gl" />
        <span className="ab-reach__uae mono" data-reach-uae="" aria-hidden="true">
          {t("United Arab Emirates")}
        </span>
        <span className="ab-reach__mark" data-reach-mark="" aria-hidden="true">
          <i></i>
          <b className="mono">{t("Ajman · UAE")}</b>
        </span>
        <div className="wrap ab-reach__copy">
          <div className="ab-reach__text">
            <p className="eyebrow">
              <CmsText section="reach" field="eyebrow">{t("From Ajman to the world")}</CmsText>
            </p>
            <h2 className="ab-reach__title" id="reach-title">
              <CmsText section="reach" field="heading">
                {t("One factory in Ajman.")}
                <br />
                <span className="is-dim">{t("Businesses worldwide.")}</span>
              </CmsText>
            </h2>
            <ol className="ab-reach__steps" data-reach-steps="">
              <li className="is-on">
                <span className="mono">01</span>
                <div>
                  <b>{t("Made in Ajman")}</b>
                  <p>{t("Our factory and warehouse stand in Al Jurf Industrial Area 2, Ajman.")}</p>
                </div>
              </li>
              <li>
                <span className="mono">02</span>
                <div>
                  <b>{t("Based in the UAE")}</b>
                  <p>{t("Head office and packaging division, both in Ajman, United Arab Emirates.")}</p>
                </div>
              </li>
              <li>
                <span className="mono">03</span>
                <div>
                  <b>{t("Delivered worldwide")}</b>
                  <p>{t("From the Ajman warehouse, orders are labelled, palletised and dispatched to businesses worldwide.")}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
