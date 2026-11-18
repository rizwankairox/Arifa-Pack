// Quality & Sustainability: every product in the range as one dot, the aluminium ones lit.
import { ALU_FAMILIES, getCatalogue } from '@/data/catalogue';
import { t } from '@/i18n';

export function MaterialDots() {
  return (
    <>
      {getCatalogue().products.map((p) => {
        const alu = ALU_FAMILIES.has(p.family);
        const name = `${p.ref} ${p.name}`;
        return (
          <li key={p.id} className={`mat__dot${alu ? ' is-alu' : ''}`} data-tip={name}>
            <span>
              {name}
              {alu ? t(' (aluminium)') : ''}
            </span>
          </li>
        );
      })}
    </>
  );
}
