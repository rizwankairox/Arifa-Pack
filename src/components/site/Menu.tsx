// The full-screen menu, opened from the header. (Behaviour: initMenu in src/motion/siteChrome.ts.)
import { company, menuLinks } from '@/data/site';
import { pad2 } from '@/lib/format';
import { lh, t } from '@/i18n';

export function Menu() {
  return (
    <div className="menu" id="menu" data-menu="" aria-hidden="true" data-lenis-prevent="">
      <div className="menu__panel" data-menu-panel="">
        <div className="menu__grid">
          <div className="menu__main">
            <ol className="menu__list" data-menu-list="">
              {menuLinks.map((l, i) => (
                <li key={l.href}>
                  <a href={lh(l.href)}>
                    <span className="menu__num mono">{pad2(i + 1)}</span>
                    <span className="menu__label">{t(l.label)}</span>
                  </a>
                </li>
              ))}
            </ol>
            {/* shows once there's something in the enquiry list (count: initMenu in src/motion/siteChrome.ts) */}
            <a className="menu__enquiry" href={lh("/contact")} data-menu-enquiry="" hidden>
              <span className="menu__enquiry-label">{t("Enquiry list")}</span>
              <span className="menu__enquiry-count mono" data-menu-enquiry-count="">0</span>
              <span className="menu__enquiry-go">
                {t("Request a quote")}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </a>
          </div>
          <aside className="menu__aside">
            <div className="menu__media">
              <video
                data-menu-video=""
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/warehouse-walk.webp"
                src="/media/clips/warehouse-walk-640.mp4"
              ></video>
            </div>
            <dl className="menu__info">
              <div>
                <dt className="mono">{t("Head office")}</dt>
                <dd>{t(company.address)}</dd>
              </div>
              <div>
                <dt className="mono">{t("Call")}</dt>
                <dd>
                  <a href={`tel:${company.phones[0].tel}`}>{company.phones[0].label}</a>
                </dd>
              </div>
              <div>
                <dt className="mono">{t("Write")}</dt>
                <dd>
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
