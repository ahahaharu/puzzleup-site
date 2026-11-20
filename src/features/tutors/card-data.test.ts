import { describe, expect, it } from 'vitest';

import {
  countReviews,
  experienceLabel,
  formatPrice,
  gradesLabel,
  toTutorCardData,
} from './card-data';

describe('gradesLabel', () => {
  it('shows a range or a single grade', () => {
    expect(gradesLabel(5, 9)).toBe('5–9 класс');
    expect(gradesLabel(9, 9)).toBe('9 класс');
  });
});

describe('experienceLabel', () => {
  it.each([
    [2025, 'Стаж 1 год'],
    [2024, 'Стаж 2 года'],
    [2021, 'Стаж 5 лет'],
    [2005, 'Стаж 21 год'],
    [2026, 'Стаж меньше года'],
  ])('since %i → %s', (since, label) => {
    expect(experienceLabel(since, 2026)).toBe(label);
  });

  it('keeps the mock-up stub while the year is a placeholder', () => {
    expect(experienceLabel('[год]', 2026)).toBe('Стаж [N] лет');
  });
});

describe('formatPrice', () => {
  it('uses a decimal comma and no trailing zeros', () => {
    expect(formatPrice(40)).toBe('40');
    expect(formatPrice(37.5)).toBe('37,5');
  });
});

describe('countReviews', () => {
  it('counts reviews per tutor', () => {
    const counts = countReviews([{ tutorId: 't-a' }, { tutorId: 't-b' }, { tutorId: 't-a' }]);
    expect(counts.get('t-a')).toBe(2);
    expect(counts.get('t-b')).toBe(1);
    expect(counts.get('t-c')).toBeUndefined();
  });
});

describe('toTutorCardData', () => {
  const tutor = {
    id: 't-example',
    slug: 'example',
    name: 'Пример',
    nameDative: 'Примеру',
    namePrepositional: 'Примере',
    photo: 'example.jpg',
    subjects: [
      { id: 'math', from: 5, to: 9 },
      { id: 'physics', from: 7, to: 9 },
      { id: 'chemistry', from: 8, to: 8 },
    ],
    education: 'Учреждение образования',
    teachingSince: 2022,
    tagline: 'Фраза о подходе',
    price: 40,
    telegram: 'example_tutor',
    viber: '+375 29 000-00-00',
  };
  const subjects = [
    { id: 'math', name: 'математика', status: 'active' as const },
    { id: 'physics', name: 'физика', status: 'hidden' as const },
    { id: 'chemistry', name: 'химия', status: 'active' as const },
  ];

  const card = toTutorCardData(tutor, {
    subjects,
    availability: 'few',
    reviewCount: 3,
    year: 2026,
  });

  it('lists only active subjects with grades', () => {
    expect(card.subjectIds).toEqual(['math', 'chemistry']);
    expect(card.subjectLines).toEqual(['Математика · 5–9 класс', 'Химия · 8 класс']);
  });

  it('joins experience and education into one line', () => {
    expect(card.credentials).toBe('Стаж 4 года · Учреждение образования');
  });

  it('takes the current availability and review count from the context', () => {
    expect(card.availability).toBe('few');
    expect(card.reviewCount).toBe(3);
  });

  it('builds the photo path and the price', () => {
    expect(card.photo).toBe('/tutors/example.jpg');
    expect(card.price).toBe('40');
  });

  it('leaves the photo empty when there is none', () => {
    const { photo: _photo, ...withoutPhoto } = tutor;
    const data = toTutorCardData(withoutPhoto, {
      subjects,
      availability: 'available',
      reviewCount: 0,
      year: 2026,
    });
    expect(data.photo).toBeUndefined();
  });
});
