// Clients & Industries — a day of packaging, and the pallet. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { initClients } from '@/sections/clients/clientsPage';

export function start() {
  return boot({
    init(lenis) {
      const page = initClients({ lenis });
      const assistant = initAssistant({ page: 'clients', lenis });
      return {
        intro() {
          page.intro();
          assistant.arrive();
          assistant.start({ quiet: true });
        },
      };
    },
  });
}
