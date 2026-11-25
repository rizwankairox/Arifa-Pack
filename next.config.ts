import type { NextConfig } from 'next';
import catalogue from './src/data/catalogue.json';

const pages = ['products', 'about', 'quality', 'clients', 'contact'];

// The previous arifapack.com site's addresses, sent to the matching page here once this site
// takes over the domain, so Google results and old bookmarks keep working. Nothing on this
// site links to the old site.
const oldProductPages = (catalogue.products as { id: string; legacyPage?: string }[])
  .filter((p) => p.legacyPage)
  .map((p) => ({ source: `/${p.legacyPage}`, destination: `/products/${p.id}`, permanent: true }));

// the old listing and category pages
const oldListings = [
  { source: '/products.php', destination: '/products' },
  { source: '/product-page2.php', destination: '/products' },
  { source: '/category.php', destination: '/products' },
  { source: '/foil.php', destination: '/products?family=foil' },
  { source: '/pot.php', destination: '/products?family=pots' },
  { source: '/sr-alu-con.php', destination: '/products?family=containers' },
  { source: '/sr-alu-pla.php', destination: '/products?family=platters' },
].map((r) => ({ ...r, permanent: true }));

// The CMS photos and videos (Cloudflare R2, NEXT_PUBLIC_MEDIA_URL): the API sends each one as a full
// address, so the pages show them as they are; this lets next/image resize them too, if a section uses it.
const media = (() => {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_MEDIA_URL || '');
    return [{ protocol: u.protocol.replace(':', '') as 'https' | 'http', hostname: u.hostname, pathname: '/**' }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  images: { remotePatterns: media },

  // the CMS reads (GET /v1/content/*) run on the server, not in the browser, so they never show in the
  // browser's Network tab: in development each one is printed in the terminal running `npm run dev`
  // (full address, and whether it came from the cache)
  logging: { fetches: { fullUrl: true, hmrRefreshes: true } },

  // The page scripts start once per page load (src/motion/PageScripts.tsx); React's development
  // double-run of effects would build every 3D scene twice, so it is switched off.
  reactStrictMode: false,

  // Old addresses keep working: the prototype's (/products.html …) and the previous site's
  // (/8325.php …) forward to the pages here.
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/index.php', destination: '/', permanent: true },
      ...pages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
      ...oldListings,
      ...oldProductPages,
    ];
  },

  // Footage, photos and fonts never change under the same name: let browsers keep them.
  async headers() {
    return [
      // Security headers, sent with every page and file. Visitors see no difference; they tell the
      // browser: never show this site inside another site's frame, treat each file as the type it
      // says it is, share only the site's name (not the page) with sites it links to, always use
      // https, and block camera, location and payment features the site doesn't use
      // (the microphone stays allowed for the assistant).
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), payment=(), usb=(), microphone=(self)' },
        ],
      },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
