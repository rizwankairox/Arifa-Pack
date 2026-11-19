/*
  04 · from the President / CEO
*/
import { t } from '@/i18n';
import { Picture } from '@/components/site/Picture';
export function Chairman() {
  return (
    <section className="ab-ceo" id="chairman" data-theme="dark" aria-labelledby="chairman-quote">
      <div className="wrap ab-ceo__inner">
        {/* one card: the words on a dark grey panel, the portrait filling the other side top to bottom */}
        <article className="ab-ceo__card ab-ticks">
          <div className="ab-ceo__panel">
            <p className="eyebrow">
              <span className="mono">(04)</span>{' '}{t("From the President / CEO")}
            </p>
            <blockquote className="ab-ceo__quote">
              <p id="chairman-quote" data-ab-scrub="">
                {t("“Think Bigger, Think Different, Be Better.”")}
              </p>
            </blockquote>
            <div className="ab-ceo__body">
              <p>
                {t("We strongly believe that sustainable growth can be achieved through innovation in a world so dynamic that the only thing constant is change. It is the only way we can stay relevant and in the forefront of the industries we operate in.")}
              </p>
              <p className="ab-sign">
                <b>{t("Sulthanul Arifeen")}</b>
                <span className="mono">{t("President / CEO · Arifa Group")}</span>
              </p>
            </div>
          </div>
          <figure className="ab-ceo__portrait">
            <Picture
              src="/images/team/sulthanul-arifeen-portrait.webp"
              widths={[560]}
              sizes="(max-width: 900px) 90vw, 45vw"
              alt={t("Black-and-white portrait of Sulthanul Arifeen, President and CEO of Arifa Group")}
              loading="lazy"
              decoding="async"
              width={1122}
              height={1402}
              data-ab-ceo-img=""
            />
          </figure>
        </article>
      </div>
    </section>
  );
}
