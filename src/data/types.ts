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
  /**
   * "trade" (default): listed in the catalogue. "self": an Arifa packet pack of a trade product
   * (the old site's sr-… pages, codes ARF-…): it has its own page but is not listed; the trade
   * product it packs (`packOf`) links to it, and it links back.
   */
  range?: 'trade' | 'self';
  /** for a pack: the trade product(s) it is a pack of */
  packOf?: string[];
  /**
   * the product's address on the previous arifapack.com site (e.g. "8325.php").
   * Never linked to: next.config.ts only uses it to redirect those old addresses to this
   * product's own page here, so existing Google results and bookmarks keep working.
   */
  legacyPage?: string;
  /** what the CMS adds about a product (CMS_API.md products: description, specs, suitability …); absent without the CMS */
  details?: ProductDetails;
};

/** a product's details from the CMS: each shown on its page only when filled in */
export type ProductDetails = {
  description?: string;
  specs?: Partial<Record<'material' | 'capacity' | 'dimensions' | 'thickness' | 'colours' | 'lid_options' | 'pieces_per_carton', string | null>>;
  suitability?: Partial<Record<'oven' | 'microwave' | 'freezer', boolean | null>>;
  applications?: string[];
  moq?: string;
  datasheet?: string;
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
  /** a trade product's packet pack (old sr-… page), if it has one */
  pack?: PackLink | null;
  /** a pack's trade product(s): the carton version */
  trade?: PackLink[];
};

/** the other version of a product: its page, code and packing */
export type PackLink = { id: string; ref: string; name: string; code: string; qty: string; url: string };

/** products: the listed (trade) products; packs: the packet packs, each with its own page but not listed */
export type Catalogue = { families: Family[]; products: Product[]; packs: Product[] };

/** the slimmer copy of the catalogue sent to the browser */
export type ClientProduct = Pick<Product, 'id' | 'family' | 'range' | 'ref' | 'name' | 'code' | 'qty' | 'img' | 'url' | 'familyName' | 'nameEn' | 'pack'>;
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
