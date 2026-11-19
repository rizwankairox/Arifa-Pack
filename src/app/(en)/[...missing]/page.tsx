// Any English address the site doesn't have (e.g. /no-such-page) → the 404 page beside it (../not-found.tsx).
import { notFound } from 'next/navigation';

export default function Missing() {
  notFound();
}
