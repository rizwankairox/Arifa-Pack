/*
  05 · What we do
*/
import { t, lh } from '@/i18n';
export function Services() {
  return (
    <section className="services" id="company" data-theme="light">
      <div className="wrap services__grid">
        <div className="services__aside">
          <p className="eyebrow">
            <span className="mono">(05)</span>{' '}{t("What we do")}
          </p>
          <h2 className="services__title" data-split-lines="">
            {t("Made in our own facility. Finished in your brand.")}
          </h2>
          <p className="services__lede">
            {t("Arifa Pack specialises in disposable packaging — aluminium containers, plastic containers and disposable cutlery — backed by consistent quality standards and a customer-first way of working.")}
          </p>
        </div>

        <div className="services__list" data-services="">
          <article className="svc">
            <button className="svc__head" type="button" aria-expanded="true">
              <span className="svc__n mono">01</span>
              <h3>{t("Food container manufacturing")}</h3>
              <span className="svc__plus" aria-hidden="true"></span>
            </button>
            <div className="svc__body">
              <div className="svc__inner">
                <p>
                  {t("Durable, food-grade containers for hot and cold food, made in our own facility to strict hygiene and quality standards. A choice of shapes, sizes and sealing options for restaurants, caterers, food distributors and retail brands.")}
                </p>
                <div className="svc__media">
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/media/posters/line-conveyor.webp"
                    data-src="/media/clips/line-conveyor.mp4"
                  ></video>
                </div>
              </div>
            </div>
          </article>
          <article className="svc">
            <button className="svc__head" type="button" aria-expanded="false">
              <span className="svc__n mono">02</span>
              <h3>{t("Custom packaging & branding")}</h3>
              <span className="svc__plus" aria-hidden="true"></span>
            </button>
            <div className="svc__body">
              <div className="svc__inner">
                <p>
                  {t("Custom-moulded containers with your branding — shapes, colours, closures and printing finishes developed with your team, compliant with food-safety standards and built for shelf appeal.")}
                </p>
                <div className="svc__media">
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/media/posters/pack-sleeve.webp"
                    data-src="/media/clips/pack-sleeve.mp4"
                  ></video>
                </div>
              </div>
            </div>
          </article>
          <article className="svc">
            <button className="svc__head" type="button" aria-expanded="false">
              <span className="svc__n mono">03</span>
              <h3>{t("Quality assurance")}</h3>
              <span className="svc__plus" aria-hidden="true"></span>
            </button>
            <div className="svc__body">
              <div className="svc__inner">
                <p>
                  {t("Quality control runs through every stage of production, so each carton is consistent with the last.")}{' '}
                  <a className="link" href={lh("/quality")}>
                    {t("See how we check")}
                  </a>
                </p>
                <div className="svc__media">
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/media/posters/inspect.webp"
                    data-src="/media/clips/inspect.mp4"
                  ></video>
                </div>
              </div>
            </div>
          </article>
          <article className="svc">
            <button className="svc__head" type="button" aria-expanded="false">
              <span className="svc__n mono">04</span>
              <h3>{t("Distribution")}</h3>
              <span className="svc__plus" aria-hidden="true"></span>
            </button>
            <div className="svc__body">
              <div className="svc__inner">
                <p>
                  {t("From our Ajman warehouse, orders are labelled, palletised and dispatched to businesses through an efficient logistics network.")}
                </p>
                <div className="svc__media">
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/media/posters/warehouse-forklift.webp"
                    data-src="/media/clips/warehouse-forklift.mp4"
                  ></video>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="wrap people">
        <header className="people__head">
          <p className="eyebrow">
            <span className="mono">(06)</span>{' '}{t("Leadership")}
          </p>
          <h2 className="people__title" data-split-lines="">
            {t("The directors")}
          </h2>
        </header>
        <ul className="people__list">
          <li className="person">
            <div className="person__img">
              <img src="/images/team/director-1.jpg" alt={t("Mr. Hamdhan Sulthanul Arifeen")} loading="lazy" width={600} height={650} />
            </div>
            <h3>{t("Hamdhan Sulthanul Arifeen")}</h3>
            <p className="mono">{t("Director")}</p>
          </li>
          <li className="person">
            <div className="person__img">
              <img src="/images/team/director-2.jpg" alt={t("Mr. Harun Sultanul Arifeen")} loading="lazy" width={600} height={650} />
            </div>
            <h3>{t("Harun Sultanul Arifeen")}</h3>
            <p className="mono">{t("Director")}</p>
          </li>
          <li className="person">
            <div className="person__img">
              <img src="/images/team/director-3.jpg" alt={t("Mr. Hanif Sulthanul Arifeen")} loading="lazy" width={600} height={650} />
            </div>
            <h3>{t("Hanif Sulthanul Arifeen")}</h3>
            <p className="mono">{t("Director")}</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
