/*
  The header on every page: the logo, the main links, Ajman's clock, the quote button and the
  menu button. (Behaviour — colour follows the section under it, hides while reading down:
  src/motion/siteChrome.ts. The clock: src/lib/clock.ts.)

  Links are plain <a> tags on purpose: moving between pages is a full page load, so the loader's
  curtain plays and the assistant can carry on where it left off.
*/
import { headerLinks } from '@/data/site';
import { LogoMark } from './LogoMark';
import { altPath, isAr, lh, t } from '@/i18n';

/** the same page in the other language: EN ⇄ عربي (the page's script keeps the filters in the address: siteChrome.ts) */
function LangSwitch({ path }: { path: string }) {
  const ar = isAr();
  return (
    // (the same button as "Request a quote" beside it: the green fill rises and the label rolls on hover)
    <a
      className="btn btn--line nav__lang"
      href={altPath(path, ar ? 'en' : 'ar')}
      hrefLang={ar ? 'en' : 'ar'}
      lang={ar ? 'en' : 'ar'}
      data-lang-switch=""
      data-magnetic=""
      aria-label={ar ? 'View this page in English' : 'عرض هذه الصفحة بالعربية'}
    >
      <span className="btn__text" data-text={ar ? 'EN' : 'عربي'}>
        {ar ? 'EN' : 'عربي'}
      </span>
    </a>
  );
}

export function Nav({ path = '/' }: { path?: string }) {
  return (
    <header className="nav" data-nav="">
      <a className="nav__logo" href={lh("/")} aria-label={t("Arifa Pack — home")} data-nav-logo="">
        <LogoMark />
      </a>
      <nav className="nav__links" aria-label={t("Primary")}>
        {headerLinks.map((l) => (
          <a key={l.href} href={lh(l.href)} data-hover-line="">
            {t(l.label)}
          </a>
        ))}
      </nav>
      <div className="nav__right">
        <LangSwitch path={path} />
        <p className="nav__status mono" data-status="">
          <i className="dot"></i>
          <span data-clock="">{t("Ajman")}</span>
        </p>
        <a className="btn btn--line" href={lh("/contact")} data-magnetic="">
          <span className="btn__text" data-text={t("Request a quote")}>
            {t("Request a quote")}
          </span>
        </a>
        <button className="nav__burger" type="button" aria-expanded="false" aria-controls="menu" data-menu-toggle="">
          <span className="nav__burger-label">
            <span>{t("Menu")}</span>
            <span>{t("Close")}</span>
          </span>
          <span className="nav__burger-icon">
            <i></i>
            <i></i>
          </span>
        </button>
      </div>
    </header>
  );
}
