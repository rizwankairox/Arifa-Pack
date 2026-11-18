/*
  Customer stories: static, crawlable panels with tabs to move between them (clientsPage.ts).
  Mock content is labelled on each story as well as in the section introduction. A real
  testimonial must use approved wording and attribution. These previews deliberately produce
  no Review or AggregateRating structured data.
*/
import { getCatalogue } from '@/data/catalogue';
import { getClients } from '@/data/clients';
import { pad2 } from '@/lib/format';
import { quoteLink } from './RouteStops';
import { lh, t } from '@/i18n';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function StoryDesk() {
  const cat = getCatalogue();
  const stories = getClients().stories;
  if (!stories.length) {
    return (
      <p className="stories__empty">
        {t("Customer stories are being prepared.")}{' '}<a href={lh("/contact")}>{t("Tell us about your packaging needs ↗")}</a>
      </p>
    );
  }
  const families = new Map(cat.families.map((f) => [f.id, f]));
  return (
    <div className="stories__desk">
      <div className="stories__panels">
        {stories.map((s, i) => (
          <article key={s.id} className="story" id={`story-${s.id}`} data-story="" aria-labelledby={`story-title-${s.id}`}>
            <figure className="story__visual">
              <img className="story__photo" src={s.image} alt={s.imageAlt} width={1536} height={1024} loading="lazy" decoding="async" />
              <span className="story__image-label mono">
                {pad2(i + 1)} / {s.scene}
              </span>
              <figcaption className="story__caption mono">{t("Illustrative AI-generated scene")}</figcaption>
              <div className="story__packing-note" aria-hidden="true">
                <span className="mono">{t("The everyday brief")}</span>
                <strong>{s.brief}</strong>
                <span className="story__packing-line"></span>
                <span className="mono">{s.note}</span>
              </div>
            </figure>
            <div className="story__body">
              <div className="story__topline">
                <p className="mono">
                  {s.sector}{' '}{t("/ Story")}{' '}{pad2(i + 1)}
                </p>
                <span className="stories__sample mono">{t(s.sample ? 'Mock testimonial' : 'Customer story')}</span>
              </div>
              <span className="story__quote-mark" aria-hidden="true">
                “
              </span>
              <blockquote>
                <p id={`story-title-${s.id}`}>{s.quote}</p>
              </blockquote>
              <div className="story__attribution">
                <span className="story__attribution-line" aria-hidden="true"></span>
                <div>
                  <p>{s.persona}</p>
                  <span>{s.attribution}</span>
                </div>
              </div>
              <div className="story__kit">
                <p className="mono">{t("The packaging in this story")}</p>
                <ul>
                  {s.families
                    .filter((id) => families.has(id))
                    .map((id) => {
                      const product = cat.products.find((p) => p.family === id && p.img);
                      return (
                        <li key={id}>
                          <a href={lh(`/products?family=${encodeURIComponent(id)}`)}>
                            {product && <img src={product.img!} alt="" loading="lazy" decoding="async" width={96} height={64} />}
                            <span>{families.get(id)!.name}</span>
                            <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      );
                    })}
                </ul>
              </div>
              <a className="story__enquiry" href={quoteLink(s.trade, s.families)}>
                <span>{s.cta}</span>
                <Arrow />
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="stories__navigation" data-story-navigation="" hidden>
        <div className="stories__tabs" data-story-tabs="" aria-label={t("Choose a customer story")}>
          {stories.map((s, i) => (
            <button key={s.id} className="stories__tab" id={`story-tab-${s.id}`} type="button" data-story-tab={i}>
              <span className="stories__tab-number mono">{pad2(i + 1)}</span>
              <span className="stories__tab-text">
                <strong>{s.sector}</strong>
                <span>{s.summary}</span>
              </span>
              <span className="stories__tab-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
        <div className="stories__paging">
          <span className="stories__count mono">
            <span data-story-current="">01</span> / {pad2(stories.length)}
          </span>
          <button type="button" data-story-prev="" aria-label={t("Previous story")}>
            <Arrow />
          </button>
          <button type="button" data-story-next="" aria-label={t("Next story")}>
            <Arrow />
          </button>
        </div>
      </div>
      <p className="stories__status sr-only" role="status" aria-live="polite" aria-atomic="true" data-story-status=""></p>
    </div>
  );
}
