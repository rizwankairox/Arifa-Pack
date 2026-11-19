/*
  The hero's family index (one link per family, under the stage) and its photo fallback for
  browsers without WebGL. Built from the catalogue and the hero's steps (src/data/heroSteps.ts).
*/
import { getCatalogue } from '@/data/catalogue';
import { HERO_PHOTOGRAPHY } from '@/data/heroPhotography';
import { heroSteps } from '@/data/heroSteps';
import { pad2, plural } from '@/lib/format';
import { isAr, lh, t } from '@/i18n';
import { Picture } from '@/components/site/Picture';

/** labels: one per product on the ring, each linking to its family */
export function HeroSteps() {
  return (
    <>
      {heroSteps(getCatalogue()).map(({ shape, f, items, photo }, i) => {
        const p = items.find((x) => x.id === photo && x.img) || items.find((x) => x.img);
        const studio = HERO_PHOTOGRAPHY[shape];
        const src = studio?.src || p?.img || '';
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
              <Picture className="hero__label-photo" src={src} widths={studio ? [640] : []} sizes="180px" alt="" width={studio?.width || 720} height={studio?.height || 474} loading="lazy" decoding="async" />
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
          <Picture
            key={shape}
            className="hero__photo"
            widths={[640]}
            sizes="(max-width: 720px) 40vw, 245px"
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
