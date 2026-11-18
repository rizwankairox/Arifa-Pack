// AI-generated photographic product cutouts, based on the Arifa catalogue, each carrying the official
// Arifa Pack mark (public/images/brand/arifa-logo.svg) printed onto its label, lid or carton.
export type HeroPhoto = { src: string; width: number; height: number; alt: string };

export const HERO_PHOTOGRAPHY = {
  container: {
    src: '/images/hero-products/arifa-container-studio.webp',
    width: 1000,
    height: 833,
    alt: 'Arifa aluminium takeaway container with a branded paperboard lid',
  },
  foil: {
    src: '/images/hero-products/arifa-foil-studio.webp',
    width: 1000,
    height: 696,
    alt: 'Arifa Pack aluminium foil carton with a silver foil roll',
  },
  platter: {
    src: '/images/hero-products/arifa-platter-studio.webp',
    width: 1000,
    height: 542,
    alt: 'Oval aluminium serving platter with the Arifa Pack mark',
  },
  cutlery: {
    src: '/images/hero-products/arifa-cutlery-studio.webp',
    width: 766,
    height: 1000,
    alt: 'Black fork, spoon and knife with an Arifa Pack paper band',
  },
  pot: {
    src: '/images/hero-products/arifa-pot-studio.webp',
    width: 1000,
    height: 550,
    alt: 'Round Arifa aluminium pot with a domed foil lid',
  },
  film: {
    src: '/images/hero-products/arifa-film-studio.webp',
    width: 1000,
    height: 717,
    alt: 'Arifa Pack cling film carton and translucent film roll',
  },
  cup: {
    src: '/images/hero-products/arifa-cup-studio.webp',
    width: 1000,
    height: 786,
    alt: 'Crimped aluminium portion cup bearing the Arifa Pack mark',
  },
  microwave: {
    src: '/images/hero-products/arifa-microwave-studio.webp',
    width: 1000,
    height: 915,
    alt: 'Black microwave container with a clear Arifa Pack branded lid',
  },
} satisfies Record<string, HeroPhoto>;

export type HeroShape = keyof typeof HERO_PHOTOGRAPHY;
