// Company details and the site's navigation, in one place. Change a phone number, the email,
// the hours or a menu item here and every page follows (nav, menu, footer, contact details,
// the enquiry emails and the data search engines read).

export const company = {
  name: 'Arifa Packing & Packaging LLC',
  short: 'Arifa Pack',
  arabic: 'عارفة للتغليف والتعبئة',
  address: 'Al Jurf Industrial Area 2, Ajman, UAE',
  /** the address as search engines read it (structured data) */
  postal: { streetAddress: 'Al Jurf Industrial Area 2', addressLocality: 'Ajman', addressCountry: 'AE' },
  /** Google Maps, searched for the factory */
  maps: 'https://maps.google.com/?q=Arifa+Packing+%26+Packaging+LLC+Al+Jurf+Industrial+Area+2+Ajman',
  hours: 'Mon – Sat, 08:00 – 20:00',
  /** the same hours, written out (translated on Arabic pages) */
  hoursLong: 'Monday – Saturday, 08:00 – 20:00',
  /** the same hours, as search engines read them (structured data) */
  hoursSchema: 'Mo-Sa 08:00-20:00',
  /** the packaging company's email: enquiries, quotes */
  email: 'info@arifapack.com',
  /** the parent group's head office */
  group: { name: 'Arifa Group', email: 'info@arifagroup.com' },
  /** [0] head office (Arifa Group), [1] packaging division: use phone.office / phone.packaging below */
  phones: [
    { label: '+971 6 747 7061', tel: '+97167477061' },
    { label: '+971 6 748 5384', tel: '+97167485384' },
  ],
  siteUrl: 'https://www.arifapack.com',
};

/** the two phone lines by name: label is how it's shown, tel is what it dials */
export const phone = { office: company.phones[0], packaging: company.phones[1] };

export type NavLink = { href: string; label: string };

/** the links across the top of every page */
export const headerLinks: NavLink[] = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/quality', label: 'Quality' },
  { href: '/clients', label: 'Clients' },
  { href: '/contact', label: 'Contact' },
];

/** the full-screen menu */
export const menuLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/quality', label: 'Quality' },
  { href: '/clients', label: 'Clients' },
  { href: '/contact', label: 'Contact' },
];

/** the footer's "Explore" column */
export const footerLinks: NavLink[] = [
  { href: '/#factory', label: 'The line' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/quality', label: 'Quality' },
  { href: '/clients', label: 'Clients' },
  { href: '/contact', label: 'Contact' },
];

/** the footer's "Categories" column: every product family, in catalogue order (ids from catalogue.json) */
export const footerCategories: NavLink[] = [
  { href: '/products?family=containers', label: 'Aluminium containers' },
  { href: '/products?family=foil', label: 'Aluminium foil' },
  { href: '/products?family=platters', label: 'Aluminium platters' },
  { href: '/products?family=cups-trays', label: 'Cups & trays' },
  { href: '/products?family=pots', label: 'Aluminium pots' },
  { href: '/products?family=microwave', label: 'Microwave products' },
  { href: '/products?family=cutlery', label: 'Cutlery' },
  { href: '/products?family=cling-film', label: 'Cling film' },
];

/*
  The CMS site settings laid over the details above (called by loadContent, src/lib/content.ts, when
  the CMS is connected; fields as GET /v1/content/site sends them: CMS_API.md "site"). Only the
  fields the CMS fills in change; the rest stay as written here. Always the English document: these
  details are shared by every visitor, so /ar pages show the address and hours through t()
  (Arabic when src/i18n/ar.ts knows the text, else English).
*/
type CmsPhone = { label?: string; number?: string; whatsapp?: boolean };
type CmsSite = {
  company_name?: string;
  site_url?: string | null;
  phones?: CmsPhone[];
  emails?: { label?: string; address?: string }[];
  addresses?: { label?: string; lines?: string[]; map_url?: string | null }[];
  hours?: { text?: string; days?: string[]; opens?: string | null; closes?: string | null } | null;
};
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const dial = (s: string) => s.replace(/[^\d+]/g, '');
const DAY = { mon: ['Mon', 'Mo'], tue: ['Tue', 'Tu'], wed: ['Wed', 'We'], thu: ['Thu', 'Th'], fri: ['Fri', 'Fr'], sat: ['Sat', 'Sa'], sun: ['Sun', 'Su'] } as const;

export function applySite(en: CmsSite) {
  if (!en) return;
  const name = str(en.company_name);
  if (name) company.name = name;
  const url = str(en.site_url);
  if (url) company.siteUrl = url.replace(/\/+$/, '');
  const email = str(en.emails?.[0]?.address);
  if (email) company.email = email;
  // phones: [head office, packaging]; label is how it's shown, number is what it dials
  (en.phones || []).slice(0, company.phones.length).forEach((p, i) => {
    const number = str(p.number) || str(p.label);
    if (number) Object.assign(company.phones[i], { label: str(p.label) || number, tel: dial(number) });
  });
  const addr = en.addresses?.[0];
  const lines = (addr?.lines || []).map(str).filter(Boolean) as string[];
  if (lines.length) {
    company.address = lines.join(', ');
    company.postal = { streetAddress: lines[0], addressLocality: lines.length > 1 ? lines[lines.length - 1].replace(/,?\s*UAE$/i, '') : company.postal.addressLocality, addressCountry: 'AE' };
  }
  if (str(addr?.map_url)) company.maps = str(addr?.map_url)!;
  const h = en.hours;
  if (h) {
    if (str(h.text)) company.hoursLong = str(h.text)!;
    const days = (h.days || []).filter((d): d is keyof typeof DAY => d in DAY);
    if (days.length && h.opens && h.closes) {
      const [a, b] = [DAY[days[0]], DAY[days[days.length - 1]]];
      company.hours = `${a[0]}${days.length > 1 ? ` – ${b[0]}` : ''}, ${h.opens} – ${h.closes}`;
      company.hoursSchema = `${a[1]}${days.length > 1 ? `-${b[1]}` : ''} ${h.opens}-${h.closes}`;
    }
  }
}
