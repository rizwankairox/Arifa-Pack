/*
  The stage: one live field of dots, pinned, re-forming for each chapter (src/sections/about/aboutStage.ts)
*/
import { SceneCanvas } from '@/three/SceneCanvas';
import { t } from '@/i18n';

export function AboutStage() {
  return (
    <div className="ab-stage" data-theme="dark" data-ab-stage="">
      {/* the live dots, pinned while the chapters scroll by */}
      <div className="ab-stage__pin" aria-hidden="true">
        <div className="ab-stage__view">
          <div className="ab-stage__light"></div>
          <SceneCanvas name="aboutStage" className="ab-stage__gl" dataAttr="data-ab-gl" />
        </div>
      </div>
      {/* chapter rail */}
      <nav className="ab-rail mono" aria-label={t("Chapters")} data-ab-rail="">
        <a href="#top" data-rail="0">
          <i></i>
          <span>{t("Arifa Pack")}</span>
        </a>
        <a href="#story" data-rail="1">
          <i></i>
          <span>{t("Heritage")}</span>
        </a>
        <a href="#values" data-rail="2">
          <i></i>
          <span>{t("Core values")}</span>
        </a>
      </nav>

      {/* 00 · hero */}
      <section className="ab-chapter ab-hero" id="top" data-chapter="0">
        <div className="wrap ab-hero__inner">
          <p className="eyebrow ab-reveal">
            <span className="mono">{t("(About)")}</span>{' '}{t("Arifa Packing & Packaging LLC")}
          </p>
          <h1 className="ab-hero__title">
            <span className="ab-line">
              <span>{t("Packaging that")}</span>
            </span>
            <span className="ab-line">
              <span>{t("protects, presents")}</span>
            </span>
            <span className="ab-line">
              <span className="is-dim">{t("and performs.")}</span>
            </span>
          </h1>
          <p className="ab-hero__lede ab-reveal">
            {t("High-quality disposable packaging — aluminium containers, plastic containers and disposable cutlery — made in Al Jurf Industrial Area 2, Ajman. The packaging division of Arifa Group.")}
          </p>
          <dl className="ab-hud mono ab-reveal">
            <div>
              <dt>{t("Group est.")}</dt>
              <dd>1997</dd>
            </div>
            <div>
              <dt>{t("Facility")}</dt>
              <dd>{t("Al Jurf · Ajman · UAE")}</dd>
            </div>
            <div>
              <dt>{t("Open")}</dt>
              <dd>{t("Mon–Sat · 08–20")}</dd>
            </div>
          </dl>
        </div>
        <a className="ab-cue mono" href="#story">
          <i aria-hidden="true"></i>{t("Scroll the story")}
        </a>
      </section>

      {/* 01 · heritage */}
      <section className="ab-chapter ab-story" id="story" data-chapter="1">
        <div className="wrap ab-chapter__inner">
          <p className="eyebrow">
            <span className="mono">(01)</span>{' '}{t("Heritage")}
          </p>
          <h2 className="ab-h2">
            {t("Arifa Group,")}
            <br />
            {t("since 1997.")}
          </h2>
          <p className="ab-scrub" data-ab-scrub="">
            {t("Arifa Group was established in 1997 and has grown into an international group with involvement in various industries, in pursuit of providing its products and services with excellence. Arifa Pack is its packaging division.")}
          </p>
          <p className="ab-body">
            {t("A strong core of ethical functioning, consistent quality standards, adherence to systems and a focus on the customer have carried that growth — and the commitment to quality and innovation remains as sincere today as it was at the start.")}
          </p>
        </div>
      </section>

      {/* 02 · core values */}
      <section className="ab-chapter ab-values" id="values" data-chapter="2">
        <div className="wrap ab-chapter__inner">
          <p className="eyebrow">
            <span className="mono">(02)</span>{' '}{t("Core values")}
          </p>
          <h2 className="ab-h2">{t("Six values, practised every day.")}</h2>
          <ol className="ab-values__list" data-ab-values="">
            <li>
              <span className="mono">01</span>{t("Trustworthy")}
            </li>
            <li>
              <span className="mono">02</span>{t("Quality oriented")}
            </li>
            <li>
              <span className="mono">03</span>{t("Commitment to building strong communities")}
            </li>
            <li>
              <span className="mono">04</span>{t("Employee safety")}
            </li>
            <li>
              <span className="mono">05</span>{t("Adaptive to market")}
            </li>
            <li>
              <span className="mono">06</span>{t("Pursuit of excellence")}
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
