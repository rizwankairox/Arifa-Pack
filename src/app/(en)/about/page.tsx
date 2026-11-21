// /about — the page itself is src/views/about.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { AboutView, metadataFor, viewport as pageViewport } from '@/views/about';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('en');
  await loadContent('about');
  return withCmsSeo(metadataFor('en'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('en');
  await loadContent('about');
  return <AboutView />;
}
