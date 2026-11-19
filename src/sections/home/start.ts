// Home — the Digital Factory. Runs in the browser once the page has loaded (src/motion/PageScripts.tsx).
import { boot } from '@/motion/boot';
import { initAssistant } from '@/assistant/assistant';
import { initHero } from '@/sections/home/heroClient';
import { initIntro } from '@/sections/home/introClient';
import { initLine } from '@/sections/home/line';
import { initRange } from '@/sections/home/range';
import { initFloor } from '@/sections/home/floor';
import { initServices } from './servicesClient';
import { initQuote } from './quote';
import { whenRenderer } from '@/three/renderers';

export function start() {
  return boot({
    async init(lenis) {
      // the 3D canvases React has put on the page (src/three/SceneCanvas.tsx)
      await whenRenderer('hero');
      const hero = initHero(lenis);
      await hero.ready;
      // the assistant waits in its dock, bottom right (src/assistant/assistant.ts)
      const assistant = initAssistant({ page: 'home', lenis });
      initIntro();
      initLine();
      initRange();
      initFloor();
      initServices();
      initQuote();
      return {
        intro() {
          const entrance = hero.intro();
          assistant.arrive();
          // once the hero has formed, the leaf (bottom right) opens a first conversation (src/assistant/assistant.ts)
          Promise.resolve(entrance).then(() => assistant.opening(hero.assist));
        },
      };
    },
  });
}
