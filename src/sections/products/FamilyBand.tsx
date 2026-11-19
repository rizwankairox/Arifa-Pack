/*
  Products hero: the eight families as one dark band of panels, each on its own factory footage
  (or, where a family has none, its studio photograph standing on the dark). Hovering a panel
  opens it out and plays its film; a click filters the catalogue below (families.ts).
  Each is still a plain link to its family's listing.
*/
import { getCatalogue, productsIn } from '@/data/catalogue';
import { FAMILY_PHOTO } from '@/data/heroSteps';
import { pad2, plural } from '@/lib/format';
import { lh, t } from '@/i18n';
import { Picture } from '@/components/site/Picture';

export function FamilyBand() {
  const cat = getCatalogue();
  return (
    <>
      {cat.families.map((f, i) => {
        const n = productsIn(cat, f.id).length;
        const ph = FAMILY_PHOTO[f.id];
        return (
          <li key={f.id} className="fams__item">
            <a
              className={`fam${f.clip ? '' : ' is-cut'}`}
              href={lh(`/products?family=${f.id}`)}
              data-fam={f.id}
              data-theme="dark"
              data-cursor-text={t("View")}
            >
              <span className="fam__media" aria-hidden="true">
                {f.clip ? (
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster={`/media/posters/${f.clip}.webp`}
                    data-src={`/media/clips/${f.clip}.mp4`}
                  ></video>
                ) : ph ? (
                  <Picture className="fam__cut" src={ph.src} widths={[640]} sizes="(max-width: 900px) 70vw, 25vw" alt="" width={ph.width} height={ph.height} loading="lazy" decoding="async" />
                ) : null}
              </span>
              <span className="fam__n mono">{pad2(i + 1)}</span>
              <span className="fam__go" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
              <span className="fam__body">
                <span className="fam__name">{f.name}</span>
                <span className="fam__count mono">{t(plural(n))}</span>
              </span>
            </a>
          </li>
        );
      })}
    </>
  );
}
