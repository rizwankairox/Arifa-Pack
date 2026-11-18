// /about (Arabic) — the page itself is src/views/about.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { AboutView, metadataFor, viewport as pageViewport } from '@/views/about';

export const metadata = metadataFor('ar');
export const viewport = pageViewport;

export default function Page() {
  setLocale('ar');
  return <AboutView />;
}
