/*
  00 · the delivery route: the factory in a white town, cartons sent down the streets to every industry, driven by scroll
*/
import { RouteStops } from './RouteStops';
import { SkipScene } from '@/components/site/SkipScene';
import { SceneCanvas } from '@/three/SceneCanvas';
import { t } from '@/i18n';

export function DeliveryRoute() {
  return (
    <section className="cl-route" id="industries" data-theme="light" data-route="" aria-labelledby="route-title">
      <div className="route__stage" data-route-stage="">
        <SkipScene />
        <SceneCanvas name="delivery" className="route__gl" dataAttr="data-route-gl" />
        <div className="route__pins" data-route-pins="" aria-hidden="true"></div>
        <div className="wrap route__ui">
          <header className="route__head">
            <p className="eyebrow">
              <span className="mono">{t("(Clients)")}</span>{' '}{t("Clients & Industries")}
            </p>
            <h1 className="route__title" id="route-title">
              <span className="cl-line">
                <span>{t("Packed in Ajman.")}</span>
              </span>{' '}
              <span className="cl-line">
                <span className="is-dim">{t("Sent to every kitchen.")}</span>
              </span>
            </h1>
            <p className="route__lede">
              {t("Bakeries, hotels, restaurants, supermarkets, caterers and distributors. Scroll to follow the cartons from our factory to each of them.")}
            </p>
            <nav className="route__jump mono" aria-label={t("Explore this page")}>
              <a href="#clients">
                {t("Our clients")}{' '}<span aria-hidden="true">↗</span>
              </a>
              <a href="#reviews">
                {t("Customer stories")}{' '}<span aria-hidden="true">↗</span>
              </a>
            </nav>
          </header>
          <div className="route__card" data-route-card="">
            <RouteStops />
          </div>
        </div>
      </div>
    </section>
  );
}
