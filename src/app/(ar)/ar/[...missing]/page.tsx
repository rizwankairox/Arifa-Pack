// Any Arabic address the site doesn't have (e.g. /ar/no-such-page) → the Arabic 404 page (../not-found.tsx).
import { notFound } from 'next/navigation';

export default function Missing() {
  notFound();
}
