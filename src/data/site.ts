// Company details and the site's navigation, in one place. Change a phone number or a menu
// item here and every page (nav, menu, footer, contact page) follows.

export const company = {
  name: 'Arifa Packing & Packaging LLC',
  short: 'Arifa Pack',
  arabic: 'عارفة للتغليف والتعبئة',
  address: 'Al Jurf Industrial Area 2, Ajman, UAE',
  hours: 'Mon – Sat, 08:00 – 20:00',
  email: 'info@arifapack.com',
  phones: [
    { label: '+971 6 747 7061', tel: '+97167477061' },
    { label: '+971 6 748 5384', tel: '+97167485384' },
  ],
  siteUrl: 'https://www.arifapack.com',
};

export type NavLink = { href: string; label: string };

/** the links across the top of every page */
export const headerLinks: NavLink[] = [
  { href: '/products', label: 'Products' },
  { href: '/#floor', label: 'Film' },
  { href: '/about', label: 'About' },
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
  { href: '/#floor', label: 'Factory film' },
  { href: '/about', label: 'About' },
  { href: '/quality', label: 'Quality' },
  { href: '/clients', label: 'Clients' },
  { href: '/contact', label: 'Contact' },
];

/** the footer's "Categories" column */
export const footerCategories: NavLink[] = [
  { href: '/products?family=containers', label: 'Aluminium containers' },
  { href: '/products?family=foil', label: 'Aluminium foil' },
  { href: '/products?family=microwave', label: 'Microwave products' },
  { href: '/products?family=cutlery', label: 'Cutlery' },
];
