import { describe, expect, it } from 'vitest';

import type { Review } from '@/content';

import { pickReview, reviewColumns } from './columns';

const review = (id: string, tutorId: string, date: string, featured = false): Review => ({
  id,
  tutorId,
  author: 'Ольга',
  relation: 'мама ученика 7 класса',
  subject: 'math',
  text: 'Текст отзыва.',
  date,
  featured,
  consent: true,
  source: 'telegram',
});

const TUTORS = [
  {
    id: 't-andrei',
    slug: 'andrei',
    name: 'Андрей',
    namePrepositional: 'Андрее',
    subjects: [{ id: 'math', from: 5, to: 9 }],
  },
  {
    id: 't-maxim',
    slug: 'maxim',
    name: 'Максим',
    namePrepositional: 'Максиме',
    subjects: [{ id: 'math', from: 5, to: 11 }],
  },
];

const SUBJECTS = [{ id: 'math', name: 'математика', status: 'active' as const }];

describe('pickReview', () => {
  it('takes the newest featured review', () => {
    const picked = pickReview([
      review('a', 't', '2026-09-01', true),
      review('b', 't', '2026-10-01', true),
      review('c', 't', '2026-11-01'),
    ]);
    expect(picked?.id).toBe('b');
  });

  it('falls back to the newest review without featured ones', () => {
    expect(pickReview([review('a', 't', '2026-09-01'), review('b', 't', '2026-10-01')])?.id).toBe(
      'b',
    );
    expect(pickReview([])).toBeUndefined();
  });
});

describe('reviewColumns', () => {
  it('builds a column per tutor with reviews, in tutor order', () => {
    const columns = reviewColumns(
      [
        review('m1', 't-maxim', '2026-10-01', true),
        review('a1', 't-andrei', '2026-09-01'),
        review('a2', 't-andrei', '2026-10-05', true),
      ],
      TUTORS,
      SUBJECTS,
    );

    expect(columns.map((column) => column.tutor.name)).toEqual(['Андрей', 'Максим']);
    expect(columns[0]).toMatchObject({
      meta: 'Математика · 5–\u20609\u00a0класс · 2\u00a0отзыва',
      allLabel: 'Все отзывы об Андрее',
      allHref: '/tutors/andrei#reviews',
      review: {
        id: 'a2',
        signature: 'Ольга, мама ученика 7 класса',
        subject: 'Математика',
        date: '5 октября 2026',
        dateTime: '2026-10-05',
      },
    });
    expect(columns[1]?.allLabel).toBe('Все отзывы о Максиме');
  });

  it('puts the tutor screenshots, newest first, into the column', () => {
    const [column] = reviewColumns(
      [
        { ...review('a1', 't-andrei', '2026-09-01'), screenshot: 'a1.png' },
        review('a2', 't-andrei', '2026-10-05', true),
        { ...review('a3', 't-andrei', '2026-10-09'), screenshot: 'a3.png' },
      ],
      TUTORS,
      SUBJECTS,
    );
    expect(column?.screenshots.map((item) => item.screenshot)).toEqual([
      '/reviews/a3.png',
      '/reviews/a1.png',
    ]);
    expect(column?.screenshotsLabel).toBe('Скриншоты отзывов об Андрее');
  });

  it('leaves out tutors without reviews and reviews of tutors who left', () => {
    const columns = reviewColumns([review('x', 't-anna', '2026-10-01', true)], TUTORS, SUBJECTS);
    expect(columns).toEqual([]);
  });
});
