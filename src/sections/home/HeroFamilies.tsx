/*
  The hero's family index (one link per family, under the stage) and its photo fallback for
  browsers without WebGL. Built from the catalogue and the hero's steps (src/data/heroSteps.ts).
*/
import { getCatalogue } from '@/data/catalogue';
import { HERO_PHOTOGRAPHY } from '@/data/heroPhotography';
import { heroSteps } from '@/data/heroSteps';
import { pad2, plural } from '@/lib/format';
import { isAr, lh, t } from '@/i18n';

/** labels: one per product on the ring, each linking to its family */
export function HeroSteps() {
  return (
    <>
      {heroSteps(getCatalogue()).map(({ shape, f, items, photo }, i) => {
        const p = items.find((x) => x.id === photo && x.img) || items.find((x) => x.img);
        const src = HERO_PHOTOGRAPHY[shape]?.src || p?.img || '';
        return (
          <li
            key={shape}
            className="hero__label"
            data-step={shape}
            data-family={f.id}
            data-photo={src}
            data-ref={p?.ref || ''}
            data-count={items.length}
          >
            <a href={lh(`/products?family=${f.id}`)}>
              <img className="hero__label-photo" src={src} alt="" width={180} height={100} loading="lazy" decoding="async" />
              <b className="mono">{pad2(i + 1)}</b>
              <span className="hero__label-t">{f.name}</span>
              <em className="mono">{t(plural(items.length))} {isAr() ? '←' : '→'}</em>
            </a>
          </li>
        );
      })}
    </>
  );
}

/** the photographs shown instead of the 3D, for browsers without WebGL */
export function HeroReel() {
  return (
    <>
      {heroSteps(getCatalogue()).map(({ shape }) => {
        const p = HERO_PHOTOGRAPHY[shape];
        return p ? (
          <img
            key={shape}
            className="hero__photo"
            data-photo={shape}
            src={p.src}
            alt={t(p.alt)}
            width={p.width}
            height={p.height}
            loading="lazy"
            decoding="async"
          />
        ) : null;
      })}
    </>
  );
}
