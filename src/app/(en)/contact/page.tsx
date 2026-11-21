// /contact — the page itself is src/views/contact.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { ContactView, metadataFor, viewport as pageViewport } from '@/views/contact';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('en');
  await loadContent('contact');
  return withCmsSeo(metadataFor('en'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('en');
  await loadContent('contact');
  return <ContactView />;
}
