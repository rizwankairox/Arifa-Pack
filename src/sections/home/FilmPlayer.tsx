/*
  Film player
*/
import { t } from '@/i18n';
export function FilmPlayer() {
  return (
    <div className="film" data-film="" role="dialog" aria-modal="true" aria-label={t("Arifa Pack factory film")} aria-hidden="true">
      <div className="film__backdrop" data-film-close=""></div>
      <div className="film__frame" data-film-frame="">
        <video data-film-video="" playsInline preload="none" poster="/media/posters/film.jpg" src="/media/arifa-film.mp4"></video>
        <div className="film__bar">
          <button className="film__btn" type="button" data-film-toggle="" aria-label={t("Pause")}>
            <svg className="i-pause" viewBox="0 0 24 24">
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
            </svg>
            <svg className="i-play" viewBox="0 0 24 24">
              <path d="M8 5.5v13l10.5-6.5z" />
            </svg>
          </button>
          <span className="film__time mono" data-film-time="">
            00:00
          </span>
          <div className="film__scrub" data-film-scrub="">
            <i className="film__buffer" data-film-buffer=""></i>
            <i className="film__fill" data-film-fill=""></i>
            <span className="film__ticks" data-film-ticks=""></span>
          </div>
          <span className="film__time mono">02:20</span>
          <button className="film__btn mono film__mute" type="button" data-film-mute="">
            {t("Sound on")}
          </button>
        </div>
      </div>
      <button className="film__close mono" type="button" data-film-close="">
        {t("Close")}{' '}<span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
