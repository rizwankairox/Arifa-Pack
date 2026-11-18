/*
  05 · leadership
*/
import { t } from '@/i18n';
export function Leadership() {
  return (
    <section className="ab-people" id="leadership" data-theme="light">
      <div className="wrap">
        <header className="ab-people__head">
          <p className="eyebrow">
            <span className="mono">(05)</span>{' '}{t("Leadership")}
          </p>
          <h2 className="ab-h2" data-split-lines="">
            {t("The directors")}
          </h2>
        </header>
        <ul className="ab-people__list">
          <li className="ab-person">
            <div className="ab-person__img">
              <img src="/images/team/director-1.jpg" alt={t("Mr. Hamdhan Sulthanul Arifeen")} loading="lazy" width={600} height={650} />
            </div>
            <h3>{t("Hamdhan Sulthanul Arifeen")}</h3>
            <p className="mono">{t("Director")}</p>
            <blockquote>
              {t("“The trend of businesses seamlessly merging across a wide range of industries will inevitably accelerate due to drastic changes brought on by rapid technological advancement such as artificial intelligence (AI) and the internet of things (IoT).”")}
            </blockquote>
          </li>
          <li className="ab-person">
            <div className="ab-person__img">
              <img src="/images/team/director-2.jpg" alt={t("Mr. Harun Sultanul Arifeen")} loading="lazy" width={600} height={650} />
            </div>
            <h3>{t("Harun Sultanul Arifeen")}</h3>
            <p className="mono">{t("Director")}</p>
            <blockquote>
              {t("“There is one philosophy that remains relevant to this day — innovation. And we at Arifa choose to adopt it with the vision that it would allow us to deliver the most advanced products and services to our customers while simultaneously focusing on sustainable growth.”")}
            </blockquote>
          </li>
          <li className="ab-person">
            <div className="ab-person__img">
              <img src="/images/team/director-3.jpg" alt={t("Mr. Hanif Sulthanul Arifeen")} loading="lazy" width={600} height={650} />
            </div>
            <h3>{t("Hanif Sulthanul Arifeen")}</h3>
            <p className="mono">{t("Director")}</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
