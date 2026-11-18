// Quality & Sustainability — shown, not claimed. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { initQuality } from '@/sections/quality/qualityLine';

export function start() {
  return boot({
    init(lenis) {
      const page = initQuality();
      const assistant = initAssistant({ page: 'quality', lenis });
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
