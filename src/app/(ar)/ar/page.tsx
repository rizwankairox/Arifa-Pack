// / (Arabic) — the page itself is src/views/home.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { HomeView, metadataFor, viewport as pageViewport } from '@/views/home';

export const metadata = metadataFor('ar');
export const viewport = pageViewport;

export default function Page() {
  setLocale('ar');
  return <HomeView />;
}
