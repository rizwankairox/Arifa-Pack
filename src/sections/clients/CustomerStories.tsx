/*
  Stories remain within Clients. All mock quotes are explicitly labeled;
         replace them with approved customer wording before publishing as testimonials.
*/
import { StoryDesk } from './StoryDesk';
import { t } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';

export function CustomerStories() {
  return (
    <section className="cl-stories" id="reviews" data-theme="light" data-stories="" aria-labelledby="stories-title">
      <div className="wrap">
        <header className="stories__head">
          <div>
            <p className="eyebrow">
              <CmsText section="reviews" field="eyebrow">{t("Customer stories")}</CmsText>
            </p>
            <h2 id="stories-title">
              <CmsText section="reviews" field="heading">
                {t("From their side")}
                <br />
                <span>{t("of the counter.")}</span>
              </CmsText>
            </h2>
          </div>
          <div className="stories__intro">
            <p>{t("Behind every pack is a business with a story. Step into the everyday moments packaging is made for.")}</p>
            <p className="stories__disclosure">
              <span className="stories__sample mono">{t("Story previews")}</span>{' '}{t("Mock testimonials and illustrative AI imagery. These are not verified customer reviews.")}
            </p>
          </div>
        </header>
        <StoryDesk />
      </div>
    </section>
  );
}
