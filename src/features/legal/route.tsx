import { MDXContent } from '@content-collections/mdx/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { listedTutors } from '@/components/layout/texts';
import { getLegal, getSite, getSubjects, getTutors, type LegalSlug } from '@/content';
import { homeOgAlt } from '@/features/seo/home-metadata';
import { HOME_OG_PATH, pageMetadata } from '@/features/seo/metadata';

import { LEGAL_TITLE_ID, LegalPage } from './LegalPage';
import { legalPageData } from './page-data';
import { legalComponents } from './prose';

// Маршруты `/privacy` и `/cookies` – один шаблон (ТЗ страницы репетитора, раздел 7). Страницы
// статические и индексируются. Политика cookie есть, только когда сайт ставит cookie (ADR-057):
// без файла `/cookies` отвечает 404, а подвал и sitemap её не показывают.

export function legalMetadata(slug: LegalSlug): Metadata {
  const doc = getLegal(slug);
  if (!doc) return {};
  return pageMetadata({
    siteName: getSite().name,
    path: `/${slug}`,
    title: `${doc.title} | PuzzleUp`,
    // Своей картинки у политик нет – превью в мессенджере с картинкой главной.
    image: { url: HOME_OG_PATH, alt: homeOgAlt(getSubjects(), listedTutors(getTutors())) },
  });
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
