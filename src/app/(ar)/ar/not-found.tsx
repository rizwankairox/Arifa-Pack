// The Arabic "page not found" (404), under /ar. The page itself is src/views/notfound.tsx.
import { setLocale } from '@/i18n';
import { NotFoundView, metadataFor } from '@/views/notfound';

export const metadata = metadataFor('ar');

export default function NotFound() {
  setLocale('ar');
  return <NotFoundView />;
}
