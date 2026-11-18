// The full-screen menu, opened from the header. (Behaviour: initMenu in src/motion/siteChrome.ts.)
import { company, menuLinks } from '@/data/site';
import { pad2 } from '@/lib/format';
import { lh, t } from '@/i18n';

export function Menu() {
  return (
    <div className="menu" id="menu" data-menu="" aria-hidden="true">
      <div className="menu__panel" data-menu-panel="">
        <div className="menu__grid">
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
          <aside className="menu__aside">
            <div className="menu__media">
              <video
                data-menu-video=""
                muted
                loop
                playsInline
                preload="none"
                poster="/media/posters/warehouse-walk.jpg"
                src="/media/clips/warehouse-walk.mp4"
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
