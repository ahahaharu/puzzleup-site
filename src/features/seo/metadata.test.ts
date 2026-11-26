import { describe, expect, it } from 'vitest';

import { HOME_OG_PATH, pageMetadata } from './metadata';

describe('pageMetadata', () => {
  it('sets canonical and repeats the shared Open Graph fields', () => {
    expect(pageMetadata({ siteName: 'PuzzleUp', path: '/tutors/anna', title: 'Анна' })).toEqual({
      title: 'Анна',
      alternates: { canonical: '/tutors/anna' },
      openGraph: {
        type: 'website',
        locale: 'ru_RU',
        siteName: 'PuzzleUp',
        url: '/tutors/anna',
        title: 'Анна',
      },
    });
  });

  it('borrows an image from another route', () => {
    const meta = pageMetadata({
      siteName: 'PuzzleUp',
      path: '/privacy',
      title: 'Политика',
      image: { url: HOME_OG_PATH, alt: 'Подпись' },
    });
    expect(meta.openGraph?.images).toEqual([
      { url: '/opengraph-image', alt: 'Подпись', width: 1200, height: 630, type: 'image/png' },
    ]);
  });
});
