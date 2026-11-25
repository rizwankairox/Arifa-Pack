/*
  04 · from the President / CEO
*/
import { t } from '@/i18n';
import { Picture } from '@/components/site/Picture';
import { CmsText } from '@/components/site/CmsText';
import { cmsCollection } from '@/lib/content';

type Person = { name?: string; role?: string; kind?: string; quote?: string; message?: string; photo?: { src?: string; alt?: string } };

export function Chairman() {
  // the CMS "leadership" entry whose kind is chairman / CEO / president, when the CMS is connected
  const c = cmsCollection<Person>('leadership')?.find((p) => /chair|ceo|president/i.test(p.kind || ''));
  const paras = (c?.message || '').split(/\n{2,}|\n/).map((x) => x.trim()).filter(Boolean);
  return (
    <section className="ab-ceo" id="chairman" data-theme="dark" aria-labelledby="chairman-quote">
      <div className="wrap ab-ceo__inner">
        {/* one card: the words on a dark grey panel, the portrait filling the other side top to bottom */}
        <article className="ab-ceo__card ab-ticks">
          <div className="ab-ceo__panel">
            <p className="eyebrow">
              <CmsText section="chairman" field="eyebrow">{t("From the President / CEO")}</CmsText>
            </p>
            <blockquote className="ab-ceo__quote">
              <p id="chairman-quote" data-ab-scrub="">
                {c?.quote ? `“${c.quote.replace(/^[“"]|[”"]$/g, '')}”` : t("“Think Bigger, Think Different, Be Better.”")}
              </p>
            </blockquote>
            <div className="ab-ceo__body">
              {paras.length ? (
                paras.map((x, i) => <p key={i}>{x}</p>)
              ) : (
                <p>
                  {t("We strongly believe that sustainable growth can be achieved through innovation in a world so dynamic that the only thing constant is change. It is the only way we can stay relevant and in the forefront of the industries we operate in.")}
                </p>
              )}
              <p className="ab-sign">
                <b>{c?.name || t("Sulthanul Arifeen")}</b>
                <span className="mono">{c?.role || t("President / CEO · Arifa Group")}</span>
              </p>
            </div>
          </div>
          <figure className="ab-ceo__portrait">
            <Picture
              src={c?.photo?.src || "/images/team/sulthanul-arifeen-portrait.webp"}
              widths={[560]}
              sizes="(max-width: 900px) 90vw, 45vw"
              alt={c?.photo?.src ? c.photo.alt || c.name || '' : t("Black-and-white portrait of Sulthanul Arifeen, President and CEO of Arifa Group")}
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
