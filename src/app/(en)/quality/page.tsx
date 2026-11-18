// /quality — the page itself is src/views/quality.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { QualityView, metadataFor, viewport as pageViewport } from '@/views/quality';

export const metadata = metadataFor('en');
export const viewport = pageViewport;

export default function Page() {
  setLocale('en');
  return <QualityView />;
}
