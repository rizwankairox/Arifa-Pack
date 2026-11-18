// /contact (Arabic) — the page itself is src/views/contact.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { ContactView, metadataFor, viewport as pageViewport } from '@/views/contact';

export const metadata = metadataFor('ar');
export const viewport = pageViewport;

export default function Page() {
  setLocale('ar');
  return <ContactView />;
}
