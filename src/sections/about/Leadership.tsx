/*
  05 · leadership
*/
import { t } from '@/i18n';
import { CmsText } from '@/components/site/CmsText';
import { cmsCollection } from '@/lib/content';

type Person = { name: string; role: string; photo: string; alt: string; quote?: string };

/** the directors: the CMS "leadership" collection (in the page's language) when it is connected, else as written here */
function people(): Person[] {
  const cms = cmsCollection<{ name?: string; role?: string; quote?: string; photo?: { src?: string; alt?: string }; kind?: string }>('leadership');
  const list = cms
    ?.filter((p) => p.name && !/chair|ceo|president/i.test(p.kind || ''))
    .map((p) => ({ name: p.name!, role: p.role || '', photo: p.photo?.src || '', alt: p.photo?.alt || p.name!, quote: p.quote }));
  if (list?.length) return list;
  return [
    {
      name: t("Hamdhan Sulthanul Arifeen"), role: t("Director"), photo: '/images/team/director-1.jpg', alt: t("Mr. Hamdhan Sulthanul Arifeen"),
      quote: t("“The trend of businesses seamlessly merging across a wide range of industries will inevitably accelerate due to drastic changes brought on by rapid technological advancement such as artificial intelligence (AI) and the internet of things (IoT).”"),
    },
    {
      name: t("Harun Sultanul Arifeen"), role: t("Director"), photo: '/images/team/director-2.jpg', alt: t("Mr. Harun Sultanul Arifeen"),
      quote: t("“There is one philosophy that remains relevant to this day — innovation. And we at Arifa choose to adopt it with the vision that it would allow us to deliver the most advanced products and services to our customers while simultaneously focusing on sustainable growth.”"),
    },
    { name: t("Hanif Sulthanul Arifeen"), role: t("Director"), photo: '/images/team/director-3.jpg', alt: t("Mr. Hanif Sulthanul Arifeen") },
  ];
}

export function Leadership() {
  return (
    <section className="ab-people" id="leadership" data-theme="light">
      <div className="wrap">
        <header className="ab-people__head">
          <p className="eyebrow">
            <CmsText section="leadership" field="eyebrow">{t("Leadership")}</CmsText>
          </p>
          <h2 className="ab-h2" data-split-lines="">
            <CmsText section="leadership" field="heading">{t("The directors")}</CmsText>
          </h2>
        </header>
        <ul className="ab-people__list">
          {people().map((p) => (
            <li className="ab-person" key={p.name}>
              <div className="ab-person__img">
                <img src={p.photo} alt={p.alt} loading="lazy" width={600} height={650} />
              </div>
              <h3>{p.name}</h3>
              <p className="mono">{p.role}</p>
              {p.quote && <blockquote>{p.quote}</blockquote>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
