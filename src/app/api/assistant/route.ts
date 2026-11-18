/*
  The voice assistant's AI endpoint (runs on the server — on Vercel, as a serverless function).

    GET  /api/assistant                    → { ready }          is an AI key configured?
    POST /api/assistant  { messages, page, lang } → { say, action }   one short line to speak, and maybe one action

  The browser never sees the API key: it posts the conversation here, this calls Claude with the
  catalogue as context and four "action" tools, and returns what to say and do.
  Needs ANTHROPIC_API_KEY (in .env.local, or in Vercel → Project → Settings → Environment Variables).
  Without it the site uses its built-in scripted salesperson instead (src/assistant/brain.ts).
*/
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getCatalogue } from '@/data/catalogue';
import { buildPrompt, buildTools } from '@/assistant/server/prompt';
import type { AssistantAction, AssistantReply, Turn } from '@/assistant/types';

const MODEL = 'claude-opus-5-5';

let client: Anthropic | null = null;
let system: string | null = null;
let tools: ReturnType<typeof buildTools> | null = null;

// no key: report "not ready" straight away, so the page uses its scripted assistant without a wasted round trip
function ready() {
  if (client) return true;
  if (!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) return false;
  try {
    client = new Anthropic();
    return true;
  } catch {
    return false;
  }
}

// keep only well-formed text turns, starting with the visitor, most recent last
function cleanHistory(messages: unknown): Turn[] {
  const turns = (Array.isArray(messages) ? messages : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }) as Turn)
    .slice(-20);
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns;
}

export async function GET() {
  return NextResponse.json({ ready: ready() });
}

export async function POST(req: Request) {
  if (!ready()) return NextResponse.json({ error: 'not configured', fallback: true }, { status: 501 });

  const text = await req.text();
  if (text.length > 64_000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  let body: { messages?: unknown; page?: unknown; lang?: unknown };
  try {
    body = JSON.parse(text || '{}');
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const messages = cleanHistory(body.messages);
  if (!messages.length) return NextResponse.json({ error: 'empty conversation' }, { status: 400 });
  // where the visitor is right now rides on their latest turn, so the cached system prompt stays fixed
  const page = String(body.page || '').slice(0, 200);
  // …and so does the page's language: on the Arabic site (/ar) she answers in Arabic
  const lang = body.lang === 'ar' ? 'ar' : 'en';
  const notes = [page && `on screen: ${page}`, lang === 'ar' && 'the visitor is on the Arabic site: reply in Arabic'].filter(Boolean).join('; ');
  if (notes) messages[messages.length - 1] = { role: 'user', content: `${messages[messages.length - 1].content}\n\n[${notes}]` };

  if (!system || !tools) {
    const cat = getCatalogue();
    system = buildPrompt(cat);
    tools = buildTools(cat);
  }

  try {
    const response = (await client!.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // chat turn: low effort keeps the spoken reply quick
      output_config: { effort: 'low' },
      // if a safety classifier declines, the API retries on a fallback model in the same call
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      tools,
      tool_choice: { type: 'auto' },
      messages,
    } as Parameters<Anthropic['beta']['messages']['create']>[0])) as Anthropic.Beta.BetaMessage;

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({
        say: 'Sorry, I can’t help with that one. Is there anything about our packaging I can show you?',
        action: null,
      } satisfies AssistantReply);
    }
    const say = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const call = response.content.find((b) => b.type === 'tool_use') as { name: string; input: Record<string, string> } | undefined;
    let action: AssistantAction | null = null;
    if (call?.name === 'show_family') action = { type: 'family', id: call.input.family };
    else if (call?.name === 'show_product') action = { type: 'product', ref: call.input.ref };
    else if (call?.name === 'start_quote') action = { type: 'quote', fill: call.input };
    else if (call?.name === 'show_factory') action = { type: 'factory' };
    return NextResponse.json({ say, action } satisfies AssistantReply);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      client = null;
      return NextResponse.json({ error: 'auth', fallback: true }, { status: 401 });
    }
    if (err instanceof Anthropic.RateLimitError) return NextResponse.json({ error: 'rate limited', fallback: true }, { status: 429 });
    if (err instanceof Anthropic.APIError) return NextResponse.json({ error: `api ${err.status}`, fallback: true }, { status: 502 });
    return NextResponse.json({ error: 'server', fallback: true }, { status: 500 });
  }
}
