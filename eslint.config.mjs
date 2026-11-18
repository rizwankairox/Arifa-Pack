import next from 'eslint-config-next';

const config = [
  ...next,
  {
    rules: {
      // the site navigates with full page loads on purpose (see src/components/site/Nav.tsx)
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-location-assign-relative-destination': 'off',
      // product photos are already sized and compressed; plain <img> keeps the markup the scripts expect
      '@next/next/no-img-element': 'off',
      // the copy is written with typographic apostrophes and quotes; plain ones are fine in JSX text
      'react/no-unescaped-entities': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default config;
