// Contact — the enquiry desk, a person or the assistant, and where we are. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { initDesk } from '@/sections/contact/enquiryDeskClient';
import { initContactInfo } from '@/sections/contact/contactInfo';

export function start() {
  return boot({
    init(lenis) {
      const desk = initDesk({ lenis });
      initContactInfo();
      const assistant = initAssistant({ page: 'contact', lenis });
      return {
        intro() {
          desk.intro();
          assistant.arrive();
          assistant.start({ quiet: true });
        },
      };
    },
  });
}
