import { describe, expect, it } from 'vitest';

import type { Availability } from '@/lib/availability';

import { sortByAvailability } from './sort';

const tutor = (id: string, availability: Availability, order: number) => ({
  id,
  availability,
  order,
});

describe('sortByAvailability', () => {
  it('puts available first, then few, then full', () => {
    const sorted = sortByAvailability([
      tutor('full', 'full', 1),
      tutor('few', 'few', 2),
      tutor('available', 'available', 3),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['available', 'few', 'full']);
  });

  it('orders by `order` within a status', () => {
    const sorted = sortByAvailability([
      tutor('c', 'few', 30),
      tutor('a', 'available', 20),
      tutor('b', 'few', 10),
      tutor('d', 'available', 5),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('keeps the input order for equal status and order and does not mutate the input', () => {
    const input = [tutor('first', 'full', 10), tutor('second', 'full', 10)];
    const sorted = sortByAvailability(input);
    expect(sorted.map((item) => item.id)).toEqual(['first', 'second']);
    expect(sorted).not.toBe(input);
  });
});
