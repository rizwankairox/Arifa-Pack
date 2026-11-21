// /quality (Arabic) — the page itself is src/views/quality.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { loadContent, withCmsSeo } from '@/lib/content';
import { QualityView, metadataFor, viewport as pageViewport } from '@/views/quality';

// the page's text and SEO come from the CMS when it is connected (src/lib/content.ts), else from the site's files
export async function generateMetadata() {
  setLocale('ar');
  await loadContent('quality');
  return withCmsSeo(metadataFor('ar'));
}
export const viewport = pageViewport;

export default async function Page() {
  setLocale('ar');
  await loadContent('quality');
  return <QualityView />;
}
