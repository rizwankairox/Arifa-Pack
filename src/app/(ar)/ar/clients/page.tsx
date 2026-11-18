// /clients (Arabic) — the page itself is src/views/clients.tsx, shared by both languages.
import { setLocale } from '@/i18n';
import { ClientsView, metadataFor, viewport as pageViewport } from '@/views/clients';

export const metadata = metadataFor('ar');
export const viewport = pageViewport;

export default function Page() {
  setLocale('ar');
  return <ClientsView />;
}
