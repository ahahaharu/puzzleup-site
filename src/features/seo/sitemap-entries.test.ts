import { describe, expect, it } from 'vitest';

import { sitemapEntries } from './sitemap-entries';

const DATE = new Date('2026-11-20T10:00:00+03:00');

describe('sitemapEntries', () => {
  it('lists the home page, current tutors and policies', () => {
    const entries = sitemapEntries({
      siteUrl: 'https://example.by',
      tutors: [
        { slug: 'anna', file: 'content/tutors/anna.mdx', archived: false },
        { slug: 'vera', file: 'content/tutors/vera.mdx', archived: true },
      ],
      legal: [{ slug: 'privacy', file: 'content/legal/privacy.mdx' }],
      contentDir: 'content',
      lastModified: (path) => (path === 'content/tutors/anna.mdx' ? DATE : undefined),
    });
    expect(entries).toEqual([
      { url: 'https://example.by/' },
      { url: 'https://example.by/tutors/anna', lastModified: DATE },
      { url: 'https://example.by/privacy' },
    ]);
  });
});
