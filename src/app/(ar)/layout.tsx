// The Arabic pages' outer HTML (<html lang="ar" dir="rtl">), under /ar. Shared markup: src/components/site/RootHtml.tsx.
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RootHtml } from '@/components/site/RootHtml';
import { company } from '@/data/site';

export const metadata: Metadata = {
  metadataBase: new URL(company.siteUrl),
  title: 'عارفة باك — عبوات الألمنيوم وتغليف الأغذية، صُنعت في عجمان، الإمارات',
  icons: { icon: '/images/brand/leaf.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050607',
};

export default function ArabicLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="ar">{children}</RootHtml>;
}
