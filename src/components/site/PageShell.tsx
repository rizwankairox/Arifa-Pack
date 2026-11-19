/*
  The frame every page sits in: loader, header, menu, assistant, footer — and the page's
  scripts (src/motion/PageScripts.tsx), which bring it all to life once it's in the browser.

    <PageShell page="about">
      …the page's sections…
    </PageShell>
*/
import type { ReactNode } from 'react';
import type { PageName } from '@/assistant/types';
import { PageScripts } from '@/motion/PageScripts';
import { AssistantPanel } from './AssistantPanel';
import { Footer } from './Footer';
import { Loader } from './Loader';
import { Menu } from './Menu';
import { Nav } from './Nav';
import { CatalogueData, FamilyData } from './PageData';
import { t } from '@/i18n';

type Props = {
  page: PageName;
  children: ReactNode;
  /** overlays that live outside <main> (the film player, the quick view, the enquiry tray) */
  overlays?: ReactNode;
  /** include the catalogue as JSON for this page's scripts */
  withCatalogue?: boolean;
  /** the "skip" link keyboard users get first: where it jumps to, and what it says */
  skip?: { href: string; label: string };
  /** this page's English address, when it isn't /<page> (e.g. a product page: /products/ac-8325) */
  path?: string;
};

export function PageShell({ page, children, overlays, withCatalogue = false, skip = { href: '#main', label: t('Skip to content') }, path }: Props) {
  // each page's own background and styles hang off a class on <body> (e.g. .page-about)
  const bodyClass = page === 'home' ? null : `page-${page}`;
  return (
    <>
      {bodyClass && <script dangerouslySetInnerHTML={{ __html: `document.body.classList.add('${bodyClass}')` }} />}
      <a className="skip" href={skip.href}>
        {skip.label}
      </a>
      {page === 'home' && <div className="grain" aria-hidden="true"></div>}
      <Loader />
      <Nav path={path ?? (page === 'home' ? '/' : `/${page}`)} />
      <Menu />
      <AssistantPanel />
      <FamilyData />
      <main id="main">{children}</main>
      <Footer />
      {overlays}
      {withCatalogue && <CatalogueData />}
      <PageScripts page={page} />
    </>
  );
}
