/*
  The Arifa assistant: the conversation card, the leaf it docks to (bottom right), and its own
  pointer. Everything it does is in src/assistant/assistant.ts; every answer comes from the Arifa
  backend (src/lib/arifaApi.ts, WEBSITE_API.md). There is no built-in assistant.
*/
import { t } from '@/i18n';
export function AssistantPanel() {
  return (
    <>
      <section className="assist" data-assist="" aria-label={t("Arifa assistant")} hidden>
        {/* (the halo round the panel, and the panel itself: drawn under its content) */}
        <span className="assist__glow" aria-hidden="true"></span>
        <span className="assist__bg" aria-hidden="true"></span>
        <header className="assist__head">
          <span className="assist__badge" data-assist-badge="" aria-hidden="true"></span>
          <div className="assist__id">
            <p className="assist__name">
              {t("Arifa")}{' '}<span className="mono">{t("Preview")}</span>
            </p>
            <p className="assist__sub mono" aria-hidden="true">
              <span className="assist__eq">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="assist__state"></span>
            </p>
          </div>
          {/* voice only: the mic. Once on, it stays open (and reopens on the next page) until tapped off */}
          <button className="assist__mic" type="button" data-assist-mic="" aria-pressed="false" aria-label={t("Talk to Arifa")}>
            <span className="assist__mic-ring" aria-hidden="true"></span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="3" width={6} height={11} rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
          </button>
          <button className="assist__close" type="button" data-assist-close="" aria-label={t("Close the assistant")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <ol className="assist__log" data-assist-log="" aria-live="polite"></ol>
        <p className="assist__status mono" data-assist-status=""></p>
        <div className="assist__chips" data-assist-chips=""></div>
        {/* typing, for visitors without a microphone (or who'd rather type): the same turn as speaking */}
        <form className="assist__type" data-assist-type="" autoComplete="off">
          <label className="sr-only" htmlFor="assist-text">{t("Message Arifa")}</label>
          <input id="assist-text" name="text" type="text" maxLength={2000} placeholder={t("Type a message…")} enterKeyHint="send" />
          <button type="submit" aria-label={t("Send")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <p className="assist__voice mono" data-assist-voice="" aria-live="polite"></p>
      </section>
      {/* the leaf, docked on the right while the assistant works */}
      <button className="assist-dock" type="button" data-assist-dock="" aria-label={t("Open the Arifa assistant")} hidden>
        <span className="assist-dock__float">
          <span className="assist-dock__leaf" data-assist-leaf=""></span>
        </span>
      </button>
      {/* the assistant's own pointer */}
      <div className="assist-cursor" data-assist-cursor="" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 3l14 9-6.6 1.5L9.5 20z" />
        </svg>
        <span className="assist-cursor__tag mono">{t("Arifa")}</span>
      </div>
    </>
  );
}
