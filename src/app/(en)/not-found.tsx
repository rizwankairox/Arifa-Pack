// The English "page not found" (404). The page itself is src/views/notfound.tsx.
import { setLocale } from '@/i18n';
import { NotFoundView, metadataFor } from '@/views/notfound';

export const metadata = metadataFor('en');

export default function NotFound() {
  setLocale('en');
  return <NotFoundView />;
}
