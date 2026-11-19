/*
  06 · what we do
*/
import { t, lh } from '@/i18n';
export function WhatWeDo() {
  return (
    <section className="ab-do" id="what-we-do" data-theme="dark">
      <div className="wrap">
        <header className="ab-do__head">
          <p className="eyebrow">
            <span className="mono">(06)</span>{' '}{t("What we do")}
          </p>
          <h2 className="ab-h2">{t("Made in our own facility. Finished in your brand.")}</h2>
        </header>
        <div className="ab-do__grid">
          <article className="ab-card">
            <div className="ab-card__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/line-conveyor.webp"
                data-src="/media/clips/line-conveyor.mp4"
              ></video>
            </div>
            <span className="mono">01</span>
            <h3>{t("Food container manufacturing")}</h3>
            <p>
              {t("Durable, food-grade containers for hot and cold food, made in our own facility to strict hygiene and quality standards — a choice of shapes, sizes and sealing options for restaurants, caterers, food distributors and retail brands.")}
            </p>
          </article>
          <article className="ab-card">
            <div className="ab-card__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/pack-sleeve.webp"
                data-src="/media/clips/pack-sleeve.mp4"
              ></video>
            </div>
            <span className="mono">02</span>
            <h3>{t("Custom packaging design & branding")}</h3>
            <p>
              {t("Custom-moulded containers with your branding: shapes, colours, closures and printing finishes developed with your team, compliant with food-safety standards and built for shelf appeal.")}
            </p>
          </article>
          <article className="ab-card">
            <div className="ab-card__media">
              <video muted loop playsInline preload="none" poster="/media/posters/inspect.webp" data-src="/media/clips/inspect.mp4"></video>
            </div>
            <span className="mono">03</span>
            <h3>{t("Quality assurance")}</h3>
            <p>
              {t("Strict quality control throughout production, for consistent quality and reliability for every client.")}{' '}
              <a className="link" href={lh("/quality")}>
                {t("See how we check")}
              </a>
            </p>
          </article>
          <article className="ab-card">
            <div className="ab-card__media">
              <video
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/warehouse-forklift.webp"
                data-src="/media/clips/warehouse-forklift.mp4"
              ></video>
            </div>
            <span className="mono">04</span>
            <h3>{t("Distribution")}</h3>
            <p>
              {t("From the Ajman warehouse, orders are labelled, palletised and dispatched to businesses through an efficient logistics network.")}
            </p>
          </article>
        </div>
        <a className="ab-more link mono" href={lh("/products")}>
          {t("See the full product catalogue →")}
        </a>
      </div>
    </section>
  );
}
