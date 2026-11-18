// The footer on every page. (The wordmark's letters swell toward the cursor: initFooter in src/motion/siteChrome.ts.)
import { company, footerCategories, footerLinks } from '@/data/site';
import { isAr, lh, t } from '@/i18n';

export function Footer() {
  return (
    <>
      <footer className="foot" data-theme="dark">
        <div className="wrap foot__top">
          <div className="foot__col">
            <p className="mono foot__label">{t("Explore")}</p>
            {footerLinks.map((l) => (
              <a key={l.href} href={lh(l.href)} data-hover-line="">
                {t(l.label)}
              </a>
            ))}
          </div>
          <div className="foot__col">
            <p className="mono foot__label">{t("Categories")}</p>
            {footerCategories.map((l) => (
              <a key={l.href} href={lh(l.href)} data-hover-line="">
                {t(l.label)}
              </a>
            ))}
          </div>
          <div className="foot__col">
            <p className="mono foot__label">{t("Contact")}</p>
            {company.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`} data-hover-line="">
                {p.label}
              </a>
            ))}
            <a href={`mailto:${company.email}`} data-hover-line="">
              {company.email}
            </a>
          </div>
          <div className="foot__col foot__col--wide">
            <p className="mono foot__label">{t("Visit")}</p>
            <p>
              {t(company.address)}
              <br />
              {t(company.hours)}
            </p>
          </div>
        </div>
        {/* the wordmark stays in Latin letters in both languages: it is the brand, and its letters are animated one by one */}
        <div className="foot__mark" data-foot-mark="" aria-hidden="true" dir="ltr">
          <span>Arifa</span>
          <img src="/images/brand/leaf.png" alt="" width={94} height={111} />
          <span>Pack</span>
        </div>
        <div className="wrap foot__base mono">
          <span>
            © {new Date().getFullYear()} {t(company.name)}
          </span>
          <span lang={isAr() ? "en" : "ar"} dir={isAr() ? "ltr" : "rtl"} className="foot__ar">
            {isAr() ? company.name : company.arabic}
          </span>
          <a href="#top" data-hover-line="">
            {t("Back to top ↑")}
          </a>
        </div>
      </footer>
      <div className="grain" aria-hidden="true"></div>
    </>
  );
}
