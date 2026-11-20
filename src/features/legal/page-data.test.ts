import { describe, expect, it } from 'vitest';

import { legalPageData } from './page-data';

describe('legalPageData', () => {
  it('writes the effective date in words and lists the sections', () => {
    expect(
      legalPageData({
        title: 'Политика cookie',
        effectiveDate: '2026-12-01',
        content: '## 1. Что такое cookie\n\nТекст.\n\n## 2. Как отказаться\n',
      }),
    ).toEqual({
      title: 'Политика cookie',
      effectiveDate: { label: '1 декабря 2026', dateTime: '2026-12-01' },
      headings: [
        { id: 'chto-takoe-cookie', title: '1. Что такое cookie' },
        { id: 'kak-otkazatsya', title: '2. Как отказаться' },
      ],
    });
  });

  it('shows a date placeholder as is, without a machine-readable date', () => {
    const data = legalPageData({ title: 'Политика', effectiveDate: '[дата]', content: 'Текст.' });
    expect(data.effectiveDate).toEqual({ label: '[дата]' });
    expect(data.headings).toEqual([]);
  });
});
