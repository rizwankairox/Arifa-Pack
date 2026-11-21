// Any English address the site doesn't have (e.g. /no-such-page) → the 404 page beside it (../not-found.tsx).
// First, an old-site address the CMS knows (GET /v1/content/redirects, e.g. /8325.php) moves to its new page;
// the ones written in next.config.ts are handled before this page is reached.
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { cmsRedirect } from '@/lib/redirects';

type Props = { params: Promise<{ missing: string[] }> };

export default async function Missing({ params }: Props) {
  const hit = await cmsRedirect(`/${(await params).missing.join('/')}`);
  if (hit) (hit.permanent === false ? redirect : permanentRedirect)(hit.destination);
  notFound();
}
