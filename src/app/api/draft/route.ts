/*
  GET /api/draft?token=…&path=/products: opens the site in preview for an editor (CMS_API.md §5).

  The CMS admin screen gets a 30-minute token (POST /v1/cms/preview-token) and opens this link. The
  site turns on Next.js draft mode and keeps the token in a cookie; the content readers
  (src/lib/arifaContent.ts) then send it as ?preview=… and show the drafts, never cached. An
  invalid or expired token is simply ignored by the API: the published content shows.
  GET /api/draft?exit=1 leaves preview.
*/
import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { PREVIEW_COOKIE } from '@/lib/arifaContent';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dm = await draftMode();
  const jar = await cookies();
  // only paths on this site (never a redirect elsewhere)
  const asked = url.searchParams.get('path') || '/';
  const path = /^\/(?![\\/])/.test(asked) ? asked : '/';

  if (url.searchParams.has('exit')) {
    dm.disable();
    jar.delete(PREVIEW_COOKIE);
    redirect(path);
  }
  const token = url.searchParams.get('token');
  if (!token || token.length > 4096) return new Response('missing preview token', { status: 400 });
  dm.enable();
  jar.set(PREVIEW_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 30 * 60 });
  redirect(path);
}
