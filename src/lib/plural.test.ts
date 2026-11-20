import { describe, expect, it } from 'vitest';

import { plural, pluralize } from './plural';

const REVIEWS = ['отзыв', 'отзыва', 'отзывов'] as const;

describe('plural', () => {
  it.each([
    [0, 'отзывов'],
    [1, 'отзыв'],
    [2, 'отзыва'],
    [4, 'отзыва'],
    [5, 'отзывов'],
    [11, 'отзывов'],
    [12, 'отзывов'],
    [14, 'отзывов'],
    [21, 'отзыв'],
    [22, 'отзыва'],
    [101, 'отзыв'],
    [111, 'отзывов'],
    [112, 'отзывов'],
  ])('%i → %s', (count, word) => {
    expect(plural(count, REVIEWS)).toBe(word);
  });
});

describe('pluralize', () => {
  it('puts the number before the word', () => {
    expect(pluralize(12, REVIEWS)).toBe('12 отзывов');
  });
});
