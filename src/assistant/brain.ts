/*
  Arifa's answers: every turn goes to the Arifa backend (POST /v1/public/sessions/{id}/messages,
  src/lib/arifaApi.ts). There is no built-in or scripted assistant.

  A turn sends the visitor's words, the page's language and where the visitor is (siteContext()),
  and streams back the backend's site actions (to `onAction`, as soon as each is known) and its
  reply. When the backend can't answer (not set up, not reachable, or busy), the reply says so
  plainly and, as WEBSITE_API.md §4 asks, offers WhatsApp click-to-chat.
*/
import { isArPage, tc } from '@/i18n/client';
import { apiEnabled, sendMessage, siteContext, ApiError, type SiteAction } from '@/lib/arifaApi';
import { phone } from '@/data/site';

// WhatsApp click-to-chat: the last resort when the assistant can't answer
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || phone.packaging.tel).replace(/\D/g, '');
export const whatsappLink = () => `https://wa.me/${WHATSAPP}`;

/** a turn's options: how the visitor spoke, and where the backend's site actions go */
export type TurnOpts = { input?: 'text' | 'voice'; onAction?: (a: SiteAction) => void };
/** a turn's result: the line to show, and the WhatsApp link when the backend couldn't answer */
export type Turn = { say: string; whatsapp?: string };

export function createBrain() {
  let voiceConsent = false; // the visitor turned the mic on (sent when a backend session starts)
  let online = apiEnabled(); // did the backend answer the last turn?

  const unavailable = (): Turn => ({
    say: tc('I’m not available right now. Please message our team on WhatsApp and they’ll help you straight away.'),
    whatsapp: whatsappLink(),
  });

  return {
    async reply(text: string, opts: TurnOpts = {}): Promise<Turn> {
      if (!apiEnabled()) { online = false; return unavailable(); }
      const handedOver = tc('Our sales team is preparing your quotation; you’ll receive it on WhatsApp shortly.');
      try {
        // the reply's language is the backend's to choose from what the visitor writes (six languages:
        // WEBSITE_API.md §2); the page's own language goes in context.locale, and starts the session
        const r = await sendMessage(text, {
          language: undefined,
          sessionLanguage: isArPage() ? 'ar' : 'en',
          voiceConsent,
          context: siteContext({ input: opts.input || 'text' }),
          onAction: opts.onAction,
        });
        online = true;
        console.info('[Arifa] answered by the backend');
        // handed over: a person takes it from here (or the site's AI budget is used up): WhatsApp is offered too (§4)
        if (r.handed_over) return { say: r.reply ? `${r.reply}\n\n${handedOver}` : handedOver, whatsapp: whatsappLink() };
        return { say: r.reply || tc('One moment, a member of our team is with you.') };
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0;
        console.warn('[Arifa] backend did not answer:', e instanceof ApiError ? `${e.status} ${e.reason || ''}` : e);
        // the backend answered, and said no (its documented answers)
        if (status === 429) { online = true; return { say: tc('Please slow down a moment, then try again.') }; }
        if (status === 422) { online = true; return { say: tc('Sorry, I couldn’t take that message. Could you say it another way?') }; }
        // 503, or not reachable at all
        online = status === 503;
        return unavailable();
      }
    },
    /** did the backend answer the last turn? (the panel's "Live AI" / "Offline" tag) */
    online: () => online,
    /** the visitor tapped the mic: a new backend session starts with voice consent */
    setVoiceConsent(v: boolean) { voiceConsent = v; },
  };
}
