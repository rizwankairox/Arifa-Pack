/*
  GET /api/content-check?page=home&locale=en
  For the backend team: is the site connected to the CMS, and what does it get for one page?
  Reads the CMS live (never cached) and lists each block: its section_id, whether the site has a
  section with that id, and the eyebrow / heading / body the site will show. No secrets in the answer.
*/
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// the section ids the site renders, per page (the DOM ids: a contract with the CMS and the assistant)
const SECTIONS: Record<string, string[]> = {
  home: ['top', 'intro', 'factory', 'range', 'floor', 'company', 'contact'],
  products: ['top', 'families', 'catalogue', 'not-listed'],
  about: ['top', 'story', 'values', 'reach', 'chairman', 'leadership', 'what-we-do', 'visit'],
  quality: ['top', 'line', 'hygiene', 'documents', 'sustainability', 'see-it'],
  clients: ['industries', 'clients', 'reviews', 'your-business'],
  contact: ['enquiry', 'call', 'where'],
};

export async function GET(req: Request) {
  const u = new URL(req.url);
  const page = u.searchParams.get('page') || 'home';
  const locale = u.searchParams.get('locale') === 'ar' ? 'ar' : 'en';
  const base = (process.env.ARIFA_CONTENT_URL || process.env.NEXT_PUBLIC_ARIFA_API_URL || '').replace(/\/+$/, '');
  const out: Record<string, unknown> = {
    connected: !!base,
    content_url: base || '(not set: put ARIFA_CONTENT_URL or NEXT_PUBLIC_ARIFA_API_URL in .env.local, then restart)',
    revalidate_secret_set: !!process.env.KX_REVALIDATE_SECRET,
    page,
    locale,
  };
  if (!base) return NextResponse.json(out, { status: 200 });
  const url = `${base}/v1/content/pages/${encodeURIComponent(page)}?locale=${locale}`;
  out.request = url;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    out.status = r.status;
    if (!r.ok) {
      out.problem = r.status === 404 ? 'The CMS says this page is unknown or not published.' : 'The CMS answered with an error.';
      return NextResponse.json(out);
    }
    const doc = await r.json();
    const blocks: Record<string, unknown>[] = Array.isArray(doc?.data?.blocks) ? doc.data.blocks : [];
    const known = SECTIONS[page] || [];
    out.version = doc?.version;
    out.published_at = doc?.published_at;
    out.draft = doc?.draft;
    out.seo = doc?.data?.seo ?? null;
    if (!Array.isArray(doc?.data?.blocks)) out.problem = 'No data.blocks list in the answer: the site reads data.blocks[].section_id.';
    out.blocks = blocks.map((b) => ({
      section_id: b.section_id ?? null,
      on_site: known.includes(String(b.section_id)),
      hidden: !!b.hidden,
      eyebrow: b.eyebrow ?? null,
      heading: b.heading ?? null,
      body: b.body ?? null,
      note: !b.section_id
        ? 'missing section_id: the site cannot place this block'
        : !known.includes(String(b.section_id))
          ? `no section "${b.section_id}" on this page; the site's ids are: ${known.join(', ')}`
          : b.hidden
            ? 'hidden: the site shows its own text'
            : 'shown (eyebrow, heading, body)',
    }));
    out.site_sections_without_a_block = known.filter((id) => !blocks.some((b) => b.section_id === id));
  } catch (e) {
    out.status = 'unreachable';
    out.problem = `The site cannot reach the CMS: ${(e as Error).message}`;
  }
  return NextResponse.json(out);
}
