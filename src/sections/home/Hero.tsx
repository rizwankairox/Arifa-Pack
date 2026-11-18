/*
  00 · Hero
*/
import { HeroReel, HeroSteps } from './HeroFamilies';
import { SceneCanvas } from '@/three/SceneCanvas';
import { t, lh } from '@/i18n';

export function Hero() {
  return (
    <section className="hero" id="top" data-theme="dark" data-hero="">
      <h1 className="sr-only">{t("Arifa Pack — aluminium and food packaging from Ajman, UAE")}</h1>
      {/* The range in dots (src/sections/home/hero.ts, src/three/scenes/DotField.ts): the loader's dots carry straight on here. */}
      <div className="hero__inner" data-hero-inner="">
        <div className="hero__beam" data-hero-beam="" aria-hidden="true"></div>
        <div className="hero__heading">
          <p className="mono hero__eyebrow" data-hero-reveal="">
            <span></span>{' '}{t("The Arifa collection")}
          </p>
          <p className="hero__title">
            <span className="hero__line">
              <span data-hero-line="">{t("Considered in detail.")}</span>
            </span>
            <span className="hero__line hero__line--metal">
              <span data-hero-line="">{t("Made to perform.")}</span>
            </span>
          </p>
          <p className="hero__sub" data-hero-sub="">
            {t("Aluminium containers, foil, platters and food packaging, formed in aluminium and made in Ajman, UAE.")}
          </p>
          <a className="hero__cta" href={lh("/products")} data-hero-cta="">
            <span className="hero__cta-label">{t("Explore the range")}</span>
            <span className="hero__cta-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
        <p className="hero__origin mono" data-hero-reveal="">
          {t("Formed in aluminium.")}
          <br />
          {t("Made in Ajman, UAE.")}
        </p>
        <SceneCanvas name="hero" className="hero__gl" dataAttr="data-hero-gl" />
        {/* the family the dots are forming (the index below carries the same links for keyboards) */}
        <div className="hero__family" data-hero-family="" aria-hidden="true">
          <span className="hero__family-n mono" data-family-n="">
            01
          </span>
          <a className="hero__family-name" data-family-link="" href={lh("/products")} tabIndex={-1}>
            <span data-family-name=""></span>
          </a>
          <span className="hero__family-count mono" data-family-count=""></span>
        </div>
        <button className="hero__scrollcue mono" type="button" data-hero-scroll="">
          <i aria-hidden="true"></i>{t("Scroll")}
        </button>
        <div className="hero__dock" data-hero-dock="">
          <button className="hero__motion mono" type="button" aria-pressed="false" data-hero-motion="">
            {t("Pause motion")}
          </button>
          <ul className="hero__labels" aria-label={t("Product families")}>
            <HeroSteps />
          </ul>
        </div>
        {/* shown only without WebGL */}
        <div className="hero__fallback" aria-hidden="true">
          <img className="hero__fallback-logo" src="/images/brand/logo-light.png" alt="" width={260} height={140} />
          <div className="hero__photos">
            <HeroReel />
          </div>
        </div>
      </div>
    </section>
  );
}
