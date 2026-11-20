// The filter chips above the catalogue: "All" and one per family, each with its product count.
import { getCatalogue, packsIn, productsIn } from '@/data/catalogue';
import { t } from '@/i18n';

export function CategoryChips() {
  const cat = getCatalogue();
  return (
    <>
      <button className="cat-chip is-active" type="button" data-family="all" aria-pressed="true">
        {t("All")}<sup data-n={cat.products.length} data-n-self={cat.packs.length}>{cat.products.length}</sup>
      </button>
      {cat.families.map((f) => (
        <button key={f.id} className="cat-chip" type="button" data-family={f.id} aria-pressed="false">
          {f.short}
          <sup data-n={productsIn(cat, f.id).length} data-n-self={packsIn(cat, f.id).length}>{productsIn(cat, f.id).length}</sup>
        </button>
      ))}
    </>
  );
}
