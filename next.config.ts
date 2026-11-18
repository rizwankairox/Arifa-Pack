import type { NextConfig } from 'next';

const pages = ['products', 'about', 'quality', 'clients', 'contact'];

const nextConfig: NextConfig = {
  // The page scripts start once per page load (src/motion/PageScripts.tsx); React's development
  // double-run of effects would build every 3D scene twice, so it is switched off.
  reactStrictMode: false,

  // The prototype's addresses (/products.html …) keep working: they forward to the new ones.
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      ...pages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },

  // Footage, photos and fonts never change under the same name: let browsers keep them.
  async headers() {
    return [
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
    ];
  },
};

export default nextConfig;
