import type { MetadataRoute } from 'next';

import type { LegalDoc, Tutor } from '@/content';
import { tutorUrl } from '@/lib/urls';

import { absoluteUrl } from './urls';

// Sitemap – ТЗ страницы репетитора, раздел 6: страницы неушедших репетиторов (ушедший скрыт от
// поисковиков, раздел 5), плюс главная и политики – они индексируются (раздел 7).

type Sources = {
  siteUrl: string;
  tutors: readonly Pick<Tutor, 'slug' | 'file' | 'archived'>[];
  /** Политики, у которых есть страница: `/privacy`, `/cookies`. */
  legal: readonly Pick<LegalDoc, 'slug' | 'file'>[];
  /** Папка контента – для даты главной: она собирается из всего `content/`. */
  contentDir: string;
  lastModified: (path: string) => Date | undefined;
};

export function sitemapEntries({
  siteUrl,
  tutors,
  legal,
  contentDir,
  lastModified,
}: Sources): MetadataRoute.Sitemap {
  const entry = (path: string, source: string) => {
    const date = lastModified(source);
    return { url: absoluteUrl(siteUrl, path), ...(date ? { lastModified: date } : {}) };
  };

  return [
    entry('/', contentDir),
    ...tutors
      .filter((tutor) => !tutor.archived)
      .map((tutor) => entry(tutorUrl(tutor.slug), tutor.file)),
    ...legal.map((doc) => entry(`/${doc.slug}`, doc.file)),
  ];
}
