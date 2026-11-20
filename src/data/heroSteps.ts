/*
  The home hero: one photographic product per family, circling on the stage, each linked to its
  family in the catalogue. All eight families, alternating metal and plastic/roll so neighbours
  read apart. (The photographs: heroPhotography.ts.)
*/
import { HERO_PHOTOGRAPHY, type HeroShape } from './heroPhotography';
import type { Catalogue } from './types';

const HERO_STEPS: { shape: HeroShape; family: string; photo: string }[] = [
  { shape: 'container', family: 'containers', photo: 'ac-83185-r' },
  { shape: 'foil', family: 'foil', photo: 'foil-30' },
  { shape: 'platter', family: 'platters', photo: 'ap-6550' },
  { shape: 'cutlery', family: 'cutlery', photo: 'cut-black-fork' },
  { shape: 'pot', family: 'pots', photo: 'pot-22' },
  { shape: 'film', family: 'cling-film', photo: 'cling-30' },
  { shape: 'cup', family: 'cups-trays', photo: 'cup-14082' },
  { shape: 'microwave', family: 'microwave', photo: 'mw-500-black' },
];

/** the studio photograph that stands for each family (where there is one) */
export const FAMILY_PHOTO = Object.fromEntries(
  HERO_STEPS.map((s) => [s.family, HERO_PHOTOGRAPHY[s.shape]]).filter(([, ph]) => ph),
) as Record<string, (typeof HERO_PHOTOGRAPHY)[HeroShape]>;

/** the hero's steps that have a family with products in it */
export function heroSteps(cat: Catalogue) {
  return HERO_STEPS.map((s) => ({
    ...s,
    f: cat.families.find((f) => f.id === s.family)!,
    items: cat.products.filter((p) => p.family === s.family),
  })).filter((s) => s.f && s.items.length);
}
