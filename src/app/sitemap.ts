import type { MetadataRoute } from 'next';

import { getLegal, getSite, getTutors, LEGAL_SLUGS } from '@/content';
import { gitLastModified } from '@/features/seo/last-modified';
import { sitemapEntries } from '@/features/seo/sitemap-entries';

// `/sitemap.xml` – статический, собирается при сборке (ТЗ страницы репетитора, раздел 6).

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries({
    siteUrl: getSite().url,
    tutors: getTutors(),
    legal: LEGAL_SLUGS.flatMap((slug) => getLegal(slug) ?? []),
    contentDir: 'content',
    lastModified: gitLastModified,
  });
}
