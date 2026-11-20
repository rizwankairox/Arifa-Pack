/*
  02 · hygiene you can see: three details from the footage, under a lens
*/
import { t } from '@/i18n';
export function Hygiene() {
  return (
    <section className="q-hygiene" id="hygiene" data-theme="light">
      <div className="wrap">
        <div className="q-hygiene__head">
          <p className="eyebrow">
            {t("Hygiene you can see")}
          </p>
          <blockquote className="q-quote">
            <p>{t("“Our containers meet strict hygiene and quality standards, ensuring freshness, safety and convenience.”")}</p>
          </blockquote>
        </div>
        <ul className="q-lenses">
          <li className="q-lens" style={{ '--x': '59%', '--y': '52%' } as CSSVars}>
            <div className="q-lens__img">
              <img
                src="/media/posters/inspect.webp"
                alt={t("An inspector in a hairnet holds a product up to the light")}
                loading="lazy"
                width={1280}
                height={532}
              />
              <span className="q-lens__ring" aria-hidden="true"></span>
            </div>
            <p className="q-lens__label">
              <b>{t("Hairnets")}</b>
              <span className="mono">{t("at inspection")}</span>
            </p>
          </li>
          <li className="q-lens" style={{ '--x': '42%', '--y': '70%' } as CSSVars}>
            <div className="q-lens__img">
              <img
                src="/media/posters/lid-sheets.webp"
                alt={t("Gloved hands matching lids to containers")}
                loading="lazy"
                width={1280}
                height={532}
              />
              <span className="q-lens__ring" aria-hidden="true"></span>
            </div>
            <p className="q-lens__label">
              <b>{t("Gloves")}</b>
              <span className="mono">{t("on the line")}</span>
            </p>
          </li>
          <li className="q-lens" style={{ '--x': '29%', '--y': '56%' } as CSSVars}>
            <div className="q-lens__img">
              <img
                src="/media/posters/pack-box.webp"
                alt={t("A packer in an apron fills an Arifa Pack carton")}
                loading="lazy"
                width={1280}
                height={532}
              />
              <span className="q-lens__ring" aria-hidden="true"></span>
            </div>
            <p className="q-lens__label">
              <b>{t("Aprons")}</b>
              <span className="mono">{t("at packing")}</span>
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
