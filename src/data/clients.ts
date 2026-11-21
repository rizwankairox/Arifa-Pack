/*
  Clients & Industries content: from the Arifa CMS when it is connected (collections industries,
  clients, stories, already in the page's language: src/lib/content.ts), otherwise from clients.json
  (translated on /ar pages). Sample content until Arifa approves the real logos, wording and stories:
  items marked "sample": true show a visible Sample tag.
*/
import raw from './clients.json';
import type { Client, ClientsData, Industry, Story } from './types';
import { tFields } from '@/i18n';
import { cmsCollection } from '@/lib/content';

const media = (m: any): string => (m && typeof m === 'object' ? m.src || m.url || '' : typeof m === 'string' ? m : '');

export function getClients(): ClientsData {
  const d = raw as unknown as ClientsData;
  const industries = cmsCollection<Industry>('industries')?.map((i) => ({ ...i, id: i.id || i.key, families: i.families || [] }));
  const clients = cmsCollection<Client & { logo: unknown }>('clients')?.map((c) => ({ ...c, logo: media(c.logo) }));
  const stories = cmsCollection<Story & { image: unknown }>('stories')?.map((s) => ({
    ...s, id: s.id || s.key, image: media(s.image), imageAlt: s.imageAlt || (s.image as any)?.alt || '', families: s.families || [],
  }));
  // text fields are translated on /ar pages; "trade" stays English, as it pre-selects an answer on the enquiry desk by value
  return {
    industries: industries || tFields(d.industries || [], ['name', 'label', 'short', 'use']),
    clients: clients || tFields(d.clients || [], ['name']),
    stories: stories || tFields(d.stories || [], ['sector', 'scene', 'summary', 'quote', 'persona', 'attribution', 'brief', 'note', 'imageAlt', 'cta']),
  };
}
