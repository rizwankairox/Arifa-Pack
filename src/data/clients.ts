/*
  Clients & Industries content: from the Arifa CMS when it is connected (collections industries,
  clients, stories, already in the page's language: src/lib/content.ts), otherwise from clients.json
  (translated on /ar pages). Sample content until Arifa approves the real logos, wording and stories:
  items marked "sample": true show a visible Sample tag.

  The CMS's fields (CMS_API.md): industries {name, label, short, trade, use, kit}, clients {name, logo,
  industry, sample}, stories {title, industry, trade, scene, quote, author, packaging, families, media,
  sample}. A story's wording the CMS has no field for (the packing note, the button) is taken from the
  matching story in clients.json.
*/
import raw from './clients.json';
import type { Client, ClientsData, Industry, Story } from './types';
import { tFields } from '@/i18n';
import { cmsCollection } from '@/lib/content';

type Media = { src?: string; url?: string; alt?: string } | null | undefined;
const src = (m: Media | string) => (typeof m === 'string' ? m : m?.src || m?.url || '');
const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

type CmsIndustry = { key: string; name?: string; label?: string; short?: string; trade?: string; use?: string; kit?: string[]; sample?: boolean };
type CmsClient = { key: string; name?: string; logo?: Media; industry?: string; sample?: boolean };
type CmsStory = {
  key: string; title?: string; industry?: string; trade?: string; scene?: string; quote?: string; author?: string;
  packaging?: string[]; families?: string[]; media?: Media; sample?: boolean;
};

export function getClients(): ClientsData {
  const d = raw as unknown as ClientsData;
  const local = {
    industries: tFields(d.industries || [], ['name', 'label', 'short', 'use']),
    clients: tFields(d.clients || [], ['name']),
    stories: tFields(d.stories || [], ['sector', 'scene', 'summary', 'quote', 'persona', 'attribution', 'brief', 'note', 'imageAlt', 'cta']),
  };

  const industries = cmsCollection<CmsIndustry>('industries')?.map((i): Industry => {
    const was = local.industries.find((l) => l.id === i.key);
    return {
      id: i.key,
      name: txt(i.name) || was?.name || i.key,
      label: txt(i.label) || was?.label,
      short: txt(i.short) || was?.short || i.key,
      trade: txt(i.trade) || was?.trade || '',
      use: txt(i.use) || was?.use || '',
      families: i.kit?.length ? i.kit : was?.families || [],
      ...(i.sample ? { sample: true } : {}), // (the CMS says when a stop is still sample wording)
    };
  });

  const clients = cmsCollection<CmsClient>('clients')
    ?.filter((c) => txt(c.name))
    .map((c): Client => ({ name: txt(c.name), industry: txt(c.industry), logo: src(c.logo), ...(c.sample ? { sample: true } : {}) }));

  const stories = cmsCollection<CmsStory>('stories')?.map((s, i): Story => {
    const was = local.stories.find((l) => l.id === s.key) || local.stories[i];
    const sector = industries?.find((x) => x.id === s.industry)?.name || txt(s.industry) || was?.sector || '';
    return {
      id: s.key,
      sample: !!s.sample,
      sector,
      scene: txt(s.scene) || was?.scene || '',
      summary: txt(s.title) || was?.summary || '',
      quote: txt(s.quote) || was?.quote || '',
      persona: txt(s.author) || was?.persona || '',
      attribution: was?.attribution || '',
      brief: s.packaging?.length ? s.packaging.join(' · ') : was?.brief || '',
      note: was?.note || '',
      image: src(s.media) || was?.image || '',
      imageAlt: (s.media && typeof s.media === 'object' && s.media.alt) || was?.imageAlt || '',
      families: s.families?.length ? s.families : was?.families || [],
      trade: txt(s.trade) || was?.trade || '',
      cta: was?.cta || '',
    };
  });

  return {
    industries: industries?.length ? industries : local.industries,
    clients: clients?.length ? clients : local.clients,
    stories: stories?.length ? stories : local.stories,
  };
}
