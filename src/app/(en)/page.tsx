// / — the page itself is src/views/home.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { HomeView, metadataFor, viewport as pageViewport } from '@/views/home';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('en');
  await loadContent('home');
  return withCmsSeo(metadataFor('en'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('en');
  await loadContent('home');
  return <HomeView />;
}
