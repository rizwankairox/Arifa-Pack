// /about — the page itself is src/views/about.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { AboutView, metadataFor, viewport as pageViewport } from '@/views/about';

export const metadata = metadataFor('en');
export const viewport = pageViewport;

export default function Page() {
  setLocale('en');
  return <AboutView />;
}
