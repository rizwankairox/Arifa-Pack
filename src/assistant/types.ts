// Shapes shared by the assistant's browser code (assistant.ts, brain.ts) and its server route
// (src/app/api/assistant/route.ts).

/** a product family as the assistant knows it: its name and how many products it has */
export type FamilyInfo = { id: string; name: string; short: string; count: number };

/** what the assistant fills in on the quote form */
export type QuoteFill = {
  family?: string; quantity?: string; city?: string; notes?: string;
  /** from the Arifa backend (fill_enquiry): the enquiry desk's own fields */
  families?: string[]; detail?: string; size?: string; often?: string; region?: string;
  name?: string; company?: string; trade?: string; channel?: 'email' | 'call' | 'whatsapp' | string; message?: string;
};

/** something the assistant does on the page after it speaks */
export type AssistantAction =
  { type: 'family'; id: string } | { type: 'product'; ref: string } | { type: 'quote'; fill: QuoteFill } | { type: 'factory' }
  | { type: 'whatsapp'; href: string };

/** one turn of the assistant: a line to say, and maybe one action */
export type AssistantReply = { say: string; action: AssistantAction | null };

/** a line of the conversation, as sent to the AI */
export type Turn = { role: 'user' | 'assistant'; content: string };

/** the page the assistant is on */
export type PageName = 'home' | 'products' | 'product' | 'about' | 'quality' | 'clients' | 'contact' | 'notfound';
