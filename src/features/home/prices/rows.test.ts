import { describe, expect, it } from 'vitest';

import { priceRows } from './rows';

const SUBJECTS = [
  { id: 'math', status: 'active' },
  { id: 'physics', status: 'hidden' },
] as const;

describe('priceRows', () => {
  it('gives every tutor their own price and grades', () => {
    const rows = priceRows(
      [
        { slug: 'andrei', name: 'Андрей', price: 40, subjects: [{ id: 'math', from: 5, to: 9 }] },
        { slug: 'maxim', name: 'Максим', price: 37.5, subjects: [{ id: 'math', from: 5, to: 11 }] },
      ],
      SUBJECTS,
    );
    expect(rows).toEqual([
      { slug: 'andrei', name: 'Андрей', grades: '5–⁠9 класс', price: '40', href: '/tutors/andrei' },
      {
        slug: 'maxim',
        name: 'Максим',
        grades: '5–⁠11 класс',
        price: '37,5',
        href: '/tutors/maxim',
      },
    ]);
  });

  it('leaves the grades out when the tutor has no active subject', () => {
    const [row] = priceRows(
      [{ slug: 'anna', name: 'Анна', price: 40, subjects: [{ id: 'physics', from: 7, to: 11 }] }],
      SUBJECTS,
    );
    expect(row?.grades).toBeUndefined();
  });
});
