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
  The CMS site settings laid over the details above (called by loadContent, src/lib/content.ts,
  when the CMS is connected). Only the fields the CMS sends are changed; the rest stay as written
  here. Always the English document: these details are shared by every visitor, so /ar pages show
  the address and hours through t() (Arabic when src/i18n/ar.ts knows the text, else English).
*/
type Phone = string | { label?: string; number?: string; tel?: string };
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const dial = (s: string) => s.replace(/[^\d+]/g, '');

export function applySite(en: Record<string, any>) {
  if (!en) return;
  const name = str(en.company_name) || str(en.name);
  if (name) company.name = name;
  const short = str(en.short_name);
  if (short) company.short = short;
  const email = str(en.email) || str(en.emails?.[0]?.address) || str(en.emails?.[0]) || str(en.emails?.info);
  if (email) company.email = email;
  // phones: [head office, packaging], as strings or { label, number }
  const phones: Phone[] = Array.isArray(en.phones) ? en.phones : [];
  phones.slice(0, company.phones.length).forEach((p, i) => {
    const label = typeof p === 'string' ? p : str(p.number) || str(p.tel) || str(p.label);
    if (label) Object.assign(company.phones[i], { label, tel: dial(typeof p === 'object' && p.tel ? p.tel : label) });
  });
  const addr = en.addresses?.[0] ?? en.address;
  const address = str(addr) || str(addr?.text) || str(addr?.line);
  if (address) company.address = address;
  const maps = str(en.maps_url) || str(addr?.maps_url) || str(addr?.map);
  if (maps) company.maps = maps;
  const hours = str(en.hours) || str(en.hours?.short);
  if (hours) company.hours = hours;
  const hoursLong = str(en.hours?.long);
  if (hoursLong) company.hoursLong = hoursLong;
  const url = str(en.site_url);
  if (url) company.siteUrl = url.replace(/\/+$/, '');
}
