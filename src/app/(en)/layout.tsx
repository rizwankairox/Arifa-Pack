// The English pages' outer HTML (<html lang="en">). Shared markup: src/components/site/RootHtml.tsx.
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RootHtml } from '@/components/site/RootHtml';
import { company } from '@/data/site';

export const metadata: Metadata = {
  metadataBase: new URL(company.siteUrl),
  title: 'Arifa Pack — Aluminium & food packaging made in Ajman, UAE',
  icons: { icon: '/images/brand/leaf.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050607',
};

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="en">{children}</RootHtml>;
}
