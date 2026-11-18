// /contact — the page itself is src/views/contact.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { ContactView, metadataFor, viewport as pageViewport } from '@/views/contact';

export const metadata = metadataFor('en');
export const viewport = pageViewport;

export default function Page() {
  setLocale('en');
  return <ContactView />;
}
