/*
  Visitor events for the Arifa backend (POST /v1/public/sessions/{id}/events, WEBSITE_API.md §3.6).

  The site tells the assistant where the visitor is as they browse:
    page_view       each page
    product_open    a product page, or a product's quick view on /products
    product_dwell   20 seconds on that product
    enquiry_add     a product added to the enquiry list
    idle            45 seconds without a move on Contact

  Nothing is sent before the visitor has talked to Arifa (no conversation, no events: arifaApi.ts
  sendEvent), and the backend decides whether to say anything: at most 3 times a visit. When it
  does, the reply (and any actions) go to `show`, which puts them in the panel.
*/
import { apiEnabled, sendEvent, siteContext, type EventOut, type EventType } from '@/lib/arifaApi';
import { enquiry } from '@/lib/enquiry';

const DWELL = 20_000;
const IDLE = 45_000;

export function initNudges({ show }: { show: (out: EventOut) => void }) {
  if (!apiEnabled()) return;

  const send = async (type: EventType, opts: Parameters<typeof sendEvent>[1] = {}) => {
    const out = await sendEvent(type, opts);
    if (out?.reply || out?.actions?.length) show(out);
  };

  send('page_view');

  // a product in view: say so, and again after 20 s on it
  let dwell: ReturnType<typeof setTimeout> | null = null;
  const onProduct = (quickViewId: string | null) => {
    const context = siteContext(quickViewId ? { quick_view_id: quickViewId } : {});
    send('product_open', { context });
    if (dwell) clearTimeout(dwell);
    dwell = setTimeout(() => send('product_dwell', { seconds: DWELL / 1000, context }), DWELL);
  };
  if (siteContext().page === 'product') onProduct(null);
  document.addEventListener('arifa:product-open', (e) => onProduct((e as CustomEvent).detail?.id || null));
  document.addEventListener('arifa:product-close', () => { if (dwell) clearTimeout(dwell); dwell = null; });

  // something added to the enquiry list (not removed)
  let known = new Set(enquiry.list().map((i) => i.id));
  enquiry.subscribe((items) => {
    const added = items.some((i) => !known.has(i.id));
    known = new Set(items.map((i) => i.id));
    if (added) send('enquiry_add');
  });

  // Contact: 45 s without a move (once per still spell)
  if (siteContext().page === 'contact') {
    let idle: ReturnType<typeof setTimeout> | null = null;
    const wake = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => send('idle', { seconds: IDLE / 1000 }), IDLE);
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((t) => window.addEventListener(t, wake, { passive: true }));
    wake();
  }
}
