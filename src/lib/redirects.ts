// The old-site addresses the CMS moves to their new page (GET /v1/content/redirects: each product's
// legacy_paths, e.g. /8325.php → /products/ac-8325). Read by the 404 catch-all pages; the list is
// cached and refreshed with the "redirects" tag. Null when the CMS is off or has no such address.
import 'server-only';
import { getRedirects, type Redirect } from './arifaContent';

const norm = (p: string) => decodeURIComponent(p).replace(/\/+$/, '').toLowerCase() || '/';

export async function cmsRedirect(path: string): Promise<Redirect | null> {
  const list = await getRedirects();
  if (!list?.length) return null;
  const want = norm(path);
  const hit = list.find((r) => norm(r.source) === want);
  // never send a visitor off the site, or round in a circle
  if (!hit || !hit.destination.startsWith('/') || hit.destination.startsWith('//') || norm(hit.destination) === want) return null;
  return hit;
}
