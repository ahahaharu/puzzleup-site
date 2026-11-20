import { MDXContent } from '@content-collections/mdx/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { getLegal } from '@/content';

import { LegalPage } from './LegalPage';
import { legalPageData } from './page-data';
import { legalComponents } from './prose';

// Маршруты `/privacy` и `/cookies` – один шаблон (ТЗ страницы репетитора, раздел 7). Страницы
// статические и индексируются; файлы политик обязательны (`content:check`).

export type LegalSlug = 'privacy' | 'cookies';

export function legalMetadata(slug: LegalSlug): Metadata {
  const doc = getLegal(slug);
  return doc ? { title: `${doc.title} | PuzzleUp` } : {};
}

export function LegalRoute({ slug }: { slug: LegalSlug }) {
  const doc = getLegal(slug);
  if (!doc) notFound();
  const data = legalPageData(doc);

  return (
    <SiteShell>
      <LegalPage {...data}>
        <MDXContent code={doc.mdx} components={legalComponents} />
      </LegalPage>
    </SiteShell>
  );
}
