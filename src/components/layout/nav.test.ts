import { describe, expect, it } from 'vitest';

import { navLinks } from './nav';

const ALL = { hasSubjects: true, hasReviews: true };

describe('navLinks', () => {
  it('lists header items in the spec order with block anchors on the home page', () => {
    expect(navLinks(ALL, { onHome: true })).toEqual([
      { id: 'tutors', label: 'Репетиторы', href: '#tutors' },
      { id: 'how', label: 'Как это работает', href: '#how' },
      { id: 'subjects', label: 'Предметы', href: '#subjects' },
      { id: 'reviews', label: 'Отзывы', href: '#reviews' },
      { id: 'prices', label: 'Цены', href: '#prices' },
    ]);
  });

  it('links to home page anchors from other pages', () => {
    expect(navLinks(ALL, { onHome: false }).map((link) => link.href)).toEqual([
      '/#tutors',
      '/#how',
      '/#subjects',
      '/#reviews',
      '/#prices',
    ]);
  });

  it('drops items of blocks without data', () => {
    const ids = navLinks({ hasSubjects: false, hasReviews: false }, { onHome: true }).map(
      (link) => link.id,
    );

    expect(ids).toEqual(['tutors', 'how', 'prices']);
  });
});
