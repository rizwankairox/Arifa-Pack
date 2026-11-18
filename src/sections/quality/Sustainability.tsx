/*
  04 · sustainability: what the range is made of, product by product
*/
import { MaterialDots } from './MaterialDots';
import { getStats } from '@/data/catalogue';
import { pad2 } from '@/lib/format';
import { t } from '@/i18n';

export function Sustainability() {
  const stats = getStats();
  return (
    <section className="q-sus" id="sustainability" data-theme="light">
      <div className="wrap q-sus__grid">
        <div className="q-sus__text">
          <p className="eyebrow">
            <span className="mono">(04)</span>{' '}{t("Sustainability")}
          </p>
          <h2 className="q-h2">
            {t("Mostly aluminium.")}
            <br />
            <span className="is-dim">{t("Counted, not estimated.")}</span>
          </h2>
          <p className="q-sus__lede">
            {t("Aluminium can be recycled again and again without losing its quality. Every dot here is one product in our range; the lit ones are aluminium.")}
          </p>
          <dl className="q-sus__evidence">
            <div>
              <dt className="mono">{t("Source")}</dt>
              <dd>{t("The Arifa Pack catalogue,")}{' '}{pad2(stats.products)}{' '}{t("products")}</dd>
            </div>
            <div>
              <dt className="mono">{t("Aluminium")}</dt>
              <dd>{t("Containers, foil, platters, cups & trays, pots")}</dd>
            </div>
            <div>
              <dt className="mono">{t("Other materials")}</dt>
              <dd>{t("Microwave containers, cutlery, cling film")}</dd>
            </div>
          </dl>
          <p className="q-sus__note mono">{t("Further sustainability commitments will be published here with their evidence.")}</p>
        </div>
        <div className="q-mat" data-mat="">
          <p className="q-mat__big">
            <b>{pad2(stats.alu)}</b>
            <span>/ {pad2(stats.products)}</span>
          </p>
          <p className="q-mat__cap">{t("products in the Arifa Pack range are aluminium")}</p>
          <ol className="q-mat__grid" aria-label={t('The {n} products in the range, aluminium ones lit', { n: pad2(stats.products) })}>
            <MaterialDots />
          </ol>
          <p className="q-mat__legend mono">
            <span>
              <i className="is-alu"></i>{t("Aluminium ·")}{' '}{pad2(stats.alu)}
            </span>
            <span>
              <i></i>{t("Other materials ·")}{' '}{pad2(stats.other)}
            </span>
          </p>
          <p className="q-mat__tip mono" data-mat-tip="" aria-hidden="true"></p>
        </div>
      </div>
    </section>
  );
}
