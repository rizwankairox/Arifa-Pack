/*
  Contact page: the same family panels as the products page, but as checkboxes for the enquiry
  desk, in two rows of four (each row widens the panel under the cursor, like the products band).
*/
import { getCatalogue, productsIn } from '@/data/catalogue';
import { FAMILY_PHOTO } from '@/data/heroSteps';
import { pad2, plural } from '@/lib/format';
import type { Family } from '@/data/types';
import { t } from '@/i18n';
import { Picture } from '@/components/site/Picture';

function Pick({ f, index, count }: { f: Family; index: number; count: number }) {
  const ph = FAMILY_PHOTO[f.id];
  return (
    <li className="picks__item">
      <label className={`pick${f.clip ? '' : ' is-cut'}`} data-family={f.id}>
        <input type="checkbox" name="family" value={f.name} />
        <span className="pick__media" aria-hidden="true">
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
            <Picture className="pick__cut" src={ph.src} widths={[640]} sizes="(max-width: 900px) 45vw, 20vw" alt="" width={ph.width} height={ph.height} loading="lazy" decoding="async" />
          ) : null}
        </span>
        <span className="pick__n mono" aria-hidden="true">
          {pad2(index + 1)}
        </span>
        <span className="pick__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="pick__body">
          <span className="pick__name">{f.name}</span>
          <span className="pick__count mono">{t(plural(count))}</span>
        </span>
      </label>
    </li>
  );
}

export function FamilyPicks() {
  const cat = getCatalogue();
  const rows = [cat.families.slice(0, 4), cat.families.slice(4)];
  return (
    <>
      {rows.map((row, r) => (
        <ul key={r} className="picks__row">
          {row.map((f, i) => (
            <Pick key={f.id} f={f} index={r * 4 + i} count={productsIn(cat, f.id).length} />
          ))}
        </ul>
      ))}
    </>
  );
}
