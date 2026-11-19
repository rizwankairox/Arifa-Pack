// "Skip" on a long scroll-driven scene (the press on Home, the reach on About, the delivery route on
// Clients): one tap glides past the rest of it to the next section. Behaviour: initSkipScenes in
// src/motion/siteChrome.ts; look: .skip-scene in src/styles/site/chrome.css.
import { t } from '@/i18n';

export function SkipScene() {
  return (
    <button className="skip-scene mono" type="button" data-skip-scene="" aria-label={t("Skip this animation")}>
      {t("Skip")}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v13M6 12l6 6 6-6" />
      </svg>
    </button>
  );
}
