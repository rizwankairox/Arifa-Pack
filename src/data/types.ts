// The shapes of the site's content. Shared by the server (which renders the pages) and the
// browser (which filters the catalogue, fills the enquiry desk and feeds the assistant).

export type FamilyId = string;

/** one product family, as written in catalogue.json */
export type Family = {
  id: FamilyId;
  name: string;
  short: string;
  /** factory clip shown behind the family (public/media/clips/<clip>.mp4), or null */
  clip: string | null;
  blurb: string;
};

/** one product, as written in catalogue.json */
export type ProductEntry = {
  id: string;
  family: FamilyId;
  ref: string;
  name: string;
  code: string;
  qty: string;
  /** "trade" (default) or "self" (Arifa self-range retail packs) */
  range?: 'trade' | 'self';
  /**
   * the product's address on the previous arifapack.com site (e.g. "8325.php").
   * Never linked to: next.config.ts only uses it to redirect those old addresses to this
   * product's own page here, so existing Google results and bookmarks keep working.
   */
  legacyPage?: string;
};

/** a product ready for the page: with its photo (if there is one) and its family's name */
export type Product = ProductEntry & {
  range: 'trade' | 'self';
  /** /images/catalogue/<id>.webp when that file exists, otherwise null ("Photo to follow") */
  img: string | null;
  /** this product's own page on the site, e.g. /products/ac-8325 (/ar/products/… on Arabic pages) */
  url: string;
  familyName: string;
  /** the English name, kept alongside the Arabic one on /ar pages (so searching in English still works) */
  nameEn?: string;
};

export type Catalogue = { families: Family[]; products: Product[] };

/** the slimmer copy of the catalogue sent to the browser */
export type ClientProduct = Pick<Product, 'id' | 'family' | 'range' | 'ref' | 'name' | 'code' | 'qty' | 'img' | 'url' | 'familyName' | 'nameEn'>;
export type ClientCatalogue = { families: Family[]; products: ClientProduct[] };

// ── Clients & Industries (clients.json) ──

export type Industry = {
  id: string;
  name: string;
  /** the pin over its building in the 3D town */
  label?: string;
  short: string;
  /** the "kind of business" answer it pre-selects on the enquiry desk */
  trade: string;
  use: string;
  families: FamilyId[];
  /** sample content: shows a "Sample" tag until approved wording replaces it */
  sample?: boolean;
};

export type Client = { name: string; industry: string; logo: string; sample?: boolean };

export type Story = {
  id: string;
  sample?: boolean;
  sector: string;
  scene: string;
  summary: string;
  quote: string;
  persona: string;
  attribution: string;
  brief: string;
  note: string;
  image: string;
  imageAlt: string;
  families: FamilyId[];
  trade: string;
  cta: string;
};

export type ClientsData = { industries: Industry[]; clients: Client[]; stories: Story[] };
