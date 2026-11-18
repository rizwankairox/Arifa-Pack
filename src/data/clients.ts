/*
  Clients & Industries content, from clients.json (in the page's language) (sample content until Arifa approves the real
  logos, wording and stories — items marked "sample": true show a visible Sample tag).
*/
import raw from './clients.json';
import type { ClientsData } from './types';
import { tFields } from '@/i18n';

export function getClients(): ClientsData {
  const d = raw as unknown as ClientsData;
  // text fields are translated on /ar pages; "trade" stays English, as it pre-selects an answer on the enquiry desk by value
  return {
    industries: tFields(d.industries || [], ['name', 'label', 'short', 'use']),
    clients: tFields(d.clients || [], ['name']),
    stories: tFields(d.stories || [], ['sector', 'scene', 'summary', 'quote', 'persona', 'attribution', 'brief', 'note', 'imageAlt', 'cta']),
  };
}
