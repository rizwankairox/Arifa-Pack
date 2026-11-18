// The catalogue grid: each family's header (with its footage), then its products.
import { Fragment } from 'react';
import { getCatalogue, productsIn } from '@/data/catalogue';
import { pad2 } from '@/lib/format';
import type { Family } from '@/data/types';
import { ProductCard } from './ProductCard';
import { t } from '@/i18n';

function FamilyHeader({ f, n, total, index, cover }: { f: Family; n: number; total: number; index: number; cover?: string | null }) {
  return (
    <header className="fhead" data-family-head={f.id} id={`family-${f.id}`} data-theme="dark">
      <div className="fhead__media" aria-hidden="true">
        {f.clip ? (
          <video
            muted
            loop
            playsInline
            preload="none"
            poster={`/media/posters/${f.clip}.jpg`}
            data-src={`/media/clips/${f.clip}.mp4`}
          ></video>
        ) : cover ? (
          <img src={cover} alt="" loading="lazy" width={720} height={474} />
        ) : null}
      </div>
      <div className="fhead__body">
        <p className="fhead__index mono">
          {pad2(index + 1)} / {pad2(total)}
        </p>
        <h2 className="fhead__title">{f.name}</h2>
        <p className="fhead__blurb">{f.blurb}</p>
        <p className="fhead__count mono">
          <b>{n}</b> {t(n === 1 ? 'product' : 'products')}
        </p>
      </div>
    </header>
  );
}

export function ProductGrid() {
  const cat = getCatalogue();
  let i = 0;
  return (
    <>
      {cat.families.map((f, fi) => {
        const items = productsIn(cat, f.id);
        const cover = items.find((p) => p.img)?.img;
        return (
          <Fragment key={f.id}>
            <FamilyHeader f={f} n={items.length} total={cat.families.length} index={fi} cover={cover} />
            {items.map((p) => (
              <ProductCard key={p.id} p={p} index={i++} />
            ))}
          </Fragment>
        );
      })}
    </>
  );
}
