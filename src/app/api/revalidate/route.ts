/*
  POST /api/revalidate: the Arifa CMS calls this the moment an editor publishes (CMS_API.md §4).

    X-Kx-Timestamp: <unix seconds>
    X-Kx-Signature: sha256=<hex HMAC-SHA256(KX_REVALIDATE_SECRET, "<timestamp>." + raw body)>
    { "event_id", "collection", "key", "operation": "publish" | "unpublish", "tags": [...], "paths": [...] }

  A bad signature, or a timestamp more than 5 minutes off, is refused (401). Otherwise every tag and
  path is refreshed, so the change shows on the site within about a minute (the readers in
  src/lib/arifaContent.ts tag their fetches with the same names). The same event twice is harmless.
  KX_REVALIDATE_SECRET is server only: the same value as the backend's KX_APP_WEBSITE_REVALIDATE_SECRET.
*/
import crypto from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  const secret = process.env.KX_REVALIDATE_SECRET;
  if (!secret) return new Response('revalidation is not configured', { status: 503 });

  const ts = req.headers.get('x-kx-timestamp') || '';
  const sig = req.headers.get('x-kx-signature') || '';
  const body = await req.text();
  const want = `sha256=${crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')}`;
  const fresh = Number.isFinite(Number(ts)) && Math.abs(Date.now() / 1000 - Number(ts)) <= 300;
  const same = sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
  if (!fresh || !same) return new Response('bad signature', { status: 401 });

  let tags: string[] = [];
  let paths: string[] = [];
  try {
    const b = JSON.parse(body);
    tags = Array.isArray(b.tags) ? b.tags.filter((t: unknown) => typeof t === 'string') : [];
    paths = Array.isArray(b.paths) ? b.paths.filter((p: unknown) => typeof p === 'string' && p.startsWith('/')) : [];
  } catch {
    return new Response('body is not JSON', { status: 422 });
  }
  // ('max': serve the old page while the new one renders, so no visitor waits)
  tags.forEach((t) => revalidateTag(t, 'max'));
  paths.forEach((p) => revalidatePath(p));
  return Response.json({ ok: true, tags: tags.length, paths: paths.length });
}
