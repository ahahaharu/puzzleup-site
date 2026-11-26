import { MDXContent } from '@content-collections/mdx/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { getLegal, getSite, type LegalSlug } from '@/content';
import { pageMetadata } from '@/features/seo/metadata';

import { LEGAL_TITLE_ID, LegalPage } from './LegalPage';
import { legalPageData } from './page-data';
import { legalComponents } from './prose';

// Маршруты `/privacy` и `/cookies` – один шаблон (ТЗ страницы репетитора, раздел 7). Страницы
// статические и индексируются; файлы политик обязательны (`content:check`).

export function legalMetadata(slug: LegalSlug): Metadata {
  const doc = getLegal(slug);
  return doc
    ? pageMetadata({ siteName: getSite().name, path: `/${slug}`, title: `${doc.title} | PuzzleUp` })
    : {};
}

export function LegalRoute({ slug }: { slug: LegalSlug }) {
  const doc = getLegal(slug);
  if (!doc) notFound();
  const data = legalPageData(doc);

  return (
    // Нижняя панель – когда заголовок ушёл вверх, как после первого экрана главной.
    <SiteShell bottomBar={{ showAfter: LEGAL_TITLE_ID, hideWhenVisible: LEGAL_TITLE_ID }}>
      <LegalPage {...data}>
        <MDXContent code={doc.mdx} components={legalComponents} />
      </LegalPage>
    </SiteShell>
  );
}
