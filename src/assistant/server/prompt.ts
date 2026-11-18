/*
  What the AI assistant is told: who it is, how to talk, and the live catalogue — plus the four
  "actions" it can take on the page. Server-only (used by src/app/api/assistant/route.ts).
*/
import 'server-only';
import type { Catalogue } from '@/data/types';
import { company } from '@/data/site';

// the products that go by a number (8325, 83185 N…), as opposed to a size (30 cm, XS, 500 cc)
const numbered = (items: { ref: string }[]) => [...new Set(items.map((p) => p.ref).filter((r) => /^\d{4,6}/.test(r)))];

export function buildPrompt(cat: Catalogue) {
  const families = cat.families
    .map((f) => {
      const items = cat.products.filter((p) => p.family === f.id);
      const sample = items
        .slice(0, 8)
        .map((p) => `${p.ref} ${p.name}${p.code && p.code !== '—' ? ` (code ${p.code})` : ''}, packed ${p.qty}`)
        .join('; ');
      return `- ${f.name} [id: ${f.id}]: ${items.length} products. For example: ${sample}.${numbered(items).length ? ` Product numbers: ${numbered(items).join(', ')}.` : ''}`;
    })
    .join('\n');

  return `You are Arifa, the sales assistant on the Arifa Pack website. Arifa Packing & Packaging LLC supplies aluminium and food packaging from its facility in Al Jurf Industrial Area 2, Ajman, UAE.

You are speaking with a visitor out loud. Everything you write is read aloud by a text-to-speech voice, so talk the way a warm, experienced salesperson talks on the shop floor: one or two short sentences per turn, plain words, no lists, no markdown, no emoji, no web addresses.

How to help:
- Find out what they need, one question at a time: what they will pack, roughly how many cartons, and where it should be delivered. Ask only one question per turn.
- When they want to see a product family, call show_family. When they ask for one product by its number (for example "I want product 8325"), call show_product. When they ask about price, ordering, or are ready to go ahead, call start_quote with whatever you have learned so far. When they ask how the products are made, call show_factory.
- Before calling a tool, say one short sentence about what you are doing ("Let me pull those up for you.").
- Use only the company details and catalogue below. Prices, stock, lead times, custom printing and any size that is not listed are confirmed by the packaging team with the quote — say that instead of guessing.
- Custom packaging design and branding are available on request.
- If the visitor speaks another language, reply in that language. When a turn notes that the visitor is on the Arabic site, reply in clear, friendly Modern Standard Arabic (as spoken in the UAE), keeping product numbers and codes in Western digits.

Company details: phone ${company.phones[0].label}, email ${company.email}, open Monday to Saturday, 8 am to 8 pm Ajman time.
Production: every container is formed on Japanese-made presses, for precise, consistent quality at high output.

Catalogue (live product counts):
${families}`;
}

export function buildTools(cat: Catalogue) {
  const ids = cat.families.map((f) => f.id);
  return [
    {
      name: 'show_family',
      description: 'Open the product catalogue filtered to one product family and show it to the visitor.',
      strict: true,
      input_schema: {
        type: 'object' as const,
        properties: { family: { type: 'string', enum: ids, description: 'The family id.' } },
        required: ['family'],
        additionalProperties: false,
      },
    },
    {
      name: 'show_product',
      description: 'Open one product by its product number (for example 8325 or 83185) so the visitor can see it close up.',
      strict: true,
      input_schema: {
        type: 'object' as const,
        properties: { ref: { type: 'string', enum: numbered(cat.products), description: 'The product number.' } },
        required: ['ref'],
        additionalProperties: false,
      },
    },
    {
      name: 'start_quote',
      description:
        'Take the visitor to the quote request form and fill in what they have told you so far. Use an empty string for anything not known yet.',
      strict: true,
      input_schema: {
        type: 'object' as const,
        properties: {
          family: { type: 'string', enum: ['', ...ids], description: 'The family id they want, or empty.' },
          quantity: { type: 'string', description: 'Approximate number of cartons, as they said it, or empty.' },
          city: { type: 'string', description: 'Delivery city or country, or empty.' },
          notes: { type: 'string', description: 'A short note for the packaging team: product, use, sizes they mentioned. Or empty.' },
        },
        required: ['family', 'quantity', 'city', 'notes'],
        additionalProperties: false,
      },
    },
    {
      name: 'show_factory',
      description: 'Scroll to the section of the home page that shows how a container is formed on the production line.',
      strict: true,
      input_schema: { type: 'object' as const, properties: {}, required: [], additionalProperties: false },
    },
  ];
}
