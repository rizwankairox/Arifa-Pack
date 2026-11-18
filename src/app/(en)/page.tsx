// / — the page itself is src/views/home.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { HomeView, metadataFor, viewport as pageViewport } from '@/views/home';

export const metadata = metadataFor('en');
export const viewport = pageViewport;

export default function Page() {
  setLocale('en');
  return <HomeView />;
}
