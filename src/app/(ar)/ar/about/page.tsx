// /about (Arabic) — the page itself is src/views/about.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { AboutView, metadataFor, viewport as pageViewport } from '@/views/about';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('ar');
  await loadContent('about');
  return withCmsSeo(metadataFor('ar'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('ar');
  await loadContent('about');
  return <AboutView />;
}
