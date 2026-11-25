/*
  A piece of section text the client team can edit in the CMS.

    <h2><CmsText section="intro" field="heading">{t('The company')}</CmsText></h2>

  Shows the CMS block's field (pages/<page> → blocks → section_id "intro" → heading) when it is
  published, otherwise the section's own text (the children). A body may hold blank lines: each
  paragraph after the first becomes a line break.

  Headings that reveal line by line (<span class="ab-line"><span>…</span></span>) pass `line`:
  each line of the CMS text is then wrapped the same way, so the animation still finds its lines.

    <CmsText section="top" field="heading" line="ab-line">…</CmsText>
*/
import { Fragment, type ReactNode } from 'react';
import { blockText } from '@/lib/content';

type Props = {
  section: string;
  field: 'eyebrow' | 'heading' | 'body';
  /** the class of the per-line mask span, for headings that reveal line by line */
  line?: string;
  /** an attribute the inner span of each line carries (e.g. "data-hero-line") */
  lineAttr?: string;
  /** extra classes for the lines, by position (e.g. the hero's second line in brushed metal) */
  lineClasses?: string[];
  children: ReactNode;
};

export function CmsText({ section, field, line, lineAttr, lineClasses = [], children }: Props) {
  const v = blockText(section, field);
  if (v == null) return <>{children}</>;
  let parts = v.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  // a heading typed on one line ("Considered in detail. Made to perform.") still reveals sentence by sentence
  if (line && parts.length === 1) parts = parts[0].split(/(?<=[.!?؟])\s+/).filter(Boolean);
  if (line) {
    return (
      <>
        {parts.map((p, i) => (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span className={[line, lineClasses[i]].filter(Boolean).join(' ')}>
              <span {...(lineAttr ? { [lineAttr]: '' } : {})}>{p}</span>
            </span>
          </Fragment>
        ))}
      </>
    );
  }
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {p}
        </Fragment>
      ))}
    </>
  );
}
